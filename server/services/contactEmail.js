const nodemailer = require('nodemailer');

const defaultRecipient = 'luigi_peluso26@proton.me';

function isContactEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST?.trim()
    && process.env.SMTP_USER?.trim()
    && process.env.SMTP_PASS
  );
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendContactEmail({ name, email, message }) {
  if (!isContactEmailConfigured()) {
    const error = new Error('Il servizio email non è configurato sul server.');
    error.code = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }

  const host = process.env.SMTP_HOST.trim();
  const user = process.env.SMTP_USER.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    const error = new Error('La porta SMTP configurata non è valida.');
    error.code = 'EMAIL_CONFIG_INVALID';
    throw error;
  }

  const recipient = process.env.CONTACT_EMAIL?.trim() || defaultRecipient;
  const from = process.env.SMTP_FROM?.trim() || user;
  const secureSetting = process.env.SMTP_SECURE?.trim().toLowerCase();
  if (secureSetting && secureSetting !== 'true' && secureSetting !== 'false') {
    const error = new Error('SMTP_SECURE deve essere true o false.');
    error.code = 'EMAIL_CONFIG_INVALID';
    throw error;
  }
  const secure = secureSetting === undefined || secureSetting === ''
    ? port === 465
    : secureSetting === 'true';
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,
    auth: { user, pass: process.env.SMTP_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
  const safeName = name.replace(/[\r\n]+/g, ' ').trim();
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

  const result = await transporter.sendMail({
    from: { name: 'PelusoGroup - Richieste dal sito', address: from },
    to: recipient,
    replyTo: { name: safeName, address: email },
    subject: `Nuova richiesta dal sito - ${safeName.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 70)}`,
    text: `Nuova richiesta ricevuta dal sito PelusoGroup\n\nNome: ${safeName}\nEmail: ${email}\n\nMessaggio:\n${message}`,
    html: [
      '<h2>Nuova richiesta dal sito PelusoGroup</h2>',
      `<p><strong>Nome:</strong> ${escapeHtml(safeName)}</p>`,
      `<p><strong>Email:</strong> ${escapeHtml(email)}</p>`,
      `<p><strong>Messaggio:</strong><br>${safeMessage}</p>`,
    ].join(''),
  });

  if (!result.accepted.some((address) => address.toLowerCase() === recipient.toLowerCase())) {
    const error = new Error('Il server SMTP non ha accettato il destinatario.');
    error.code = 'EMAIL_RECIPIENT_REJECTED';
    throw error;
  }

  return result.messageId;
}

module.exports = { isContactEmailConfigured, sendContactEmail };
