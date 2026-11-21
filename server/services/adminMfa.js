const crypto = require('node:crypto');

const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function getEncryptionKey() {
  const configuredKey = process.env.ADMIN_MFA_ENCRYPTION_KEY?.trim();
  if (!configuredKey || !/^[A-Za-z0-9+/]+={0,2}$/.test(configuredKey)) {
    throw new Error('ADMIN_MFA_ENCRYPTION_KEY must be configured as a base64-encoded 32-byte key.');
  }
  const key = Buffer.from(configuredKey, 'base64');
  if (key.length !== 32) {
    throw new Error('ADMIN_MFA_ENCRYPTION_KEY must decode to exactly 32 bytes.');
  }
  return key;
}

function isEncryptionConfigured() {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

function encryptSecret(secret) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return [
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

function decryptSecret(value) {
  const [encodedIv, encodedTag, encodedData] = String(value || '').split('.');
  if (!encodedIv || !encodedTag || !encodedData) {
    throw new Error('Stored authenticator secret is invalid.');
  }
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(encodedIv, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encodedData, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

function encodeBase32(buffer) {
  let bits = 0;
  let value = 0;
  let encoded = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      encoded += base32Alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) encoded += base32Alphabet[(value << (5 - bits)) & 31];
  return encoded;
}

function decodeBase32(value) {
  const normalized = String(value || '').replace(/[\s=-]/g, '').toUpperCase();
  if (!normalized || [...normalized].some((character) => !base32Alphabet.includes(character))) {
    throw new Error('Authenticator secret is invalid.');
  }
  let bits = 0;
  let accumulator = 0;
  const bytes = [];
  for (const character of normalized) {
    accumulator = (accumulator << 5) | base32Alphabet.indexOf(character);
    bits += 5;
    if (bits >= 8) {
      bytes.push((accumulator >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function generateTotpCode(secret, timestamp = Date.now()) {
  const counter = Math.floor(timestamp / 30000);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac('sha1', decodeBase32(secret)).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 15;
  const binary = ((digest[offset] & 127) << 24)
    | ((digest[offset + 1] & 255) << 16)
    | ((digest[offset + 2] & 255) << 8)
    | (digest[offset + 3] & 255);
  return String(binary % 1_000_000).padStart(6, '0');
}

function verifyTotp(secret, token, timestamp = Date.now()) {
  if (!/^\d{6}$/.test(String(token || ''))) return false;
  return [-1, 0, 1].some((offset) => safeCompare(
    generateTotpCode(secret, timestamp + (offset * 30000)),
    token,
  ));
}

function generateRecoveryCodes(count = 10) {
  return Array.from({ length: count }, () => {
    const rawCode = crypto.randomBytes(5).toString('hex').toUpperCase();
    return `${rawCode.slice(0, 5)}-${rawCode.slice(5)}`;
  });
}

function normalizeRecoveryCode(code) {
  return String(code || '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function hashRecoveryCode(code) {
  return crypto.createHash('sha256').update(normalizeRecoveryCode(code)).digest('hex');
}

module.exports = {
  decryptSecret,
  encryptSecret,
  encodeBase32,
  generateRecoveryCodes,
  generateTotpCode,
  hashRecoveryCode,
  isEncryptionConfigured,
  verifyTotp,
};
