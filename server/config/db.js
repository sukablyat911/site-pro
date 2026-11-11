const mongoose = require('mongoose');

const getConnectionInfo = (uri) => {
  const parsedUri = new URL(uri);

  if (!['mongodb:', 'mongodb+srv:'].includes(parsedUri.protocol)) {
    throw new Error('MONGO_URI must use the mongodb:// or mongodb+srv:// protocol.');
  }

  return {
    host: parsedUri.host,
    database: decodeURIComponent(parsedUri.pathname.slice(1)) || '(default)',
  };
};

const getErrorDetails = (error) => {
  const details = [];
  const seen = new Set();
  let current = error;

  while (current && !seen.has(current)) {
    seen.add(current);
    details.push(current);
    current = current.cause;
  }

  return details;
};

const redactCredentials = (message) => message
  .replace(/(mongodb(?:\+srv)?:\/\/)[^@\s]+@/gi, '$1[credentials]@')
  .replace(/([?&](?:password|pwd)=)[^&\s]+/gi, '$1[redacted]');

const logConnectionFailure = (error, connectionInfo) => {
  const details = getErrorDetails(error);
  const messages = details
    .map((item) => `${item.name || ''} ${item.message || String(item)}`)
    .join(' ')
    .toLowerCase();
  const codes = details.map((item) => item.code);

  console.error('MongoDB connection failed.');
  if (connectionInfo) {
    console.error(`Target: ${connectionInfo.host}, database: ${connectionInfo.database}`);
  }

  details.forEach((item, index) => {
    const label = index === 0 ? 'Error' : 'Caused by';
    const code = item.code ? ` (code: ${item.code})` : '';
    const codeName = item.codeName ? ` [${item.codeName}]` : '';
    const name = item.name ? `${item.name}: ` : '';
    console.error(`${label}: ${name}${redactCredentials(item.message || String(item))}${code}${codeName}`);
  });

  if (codes.includes('ENOTFOUND') || codes.includes('EAI_AGAIN')
      || messages.includes('querysrv') || messages.includes('dns')) {
    console.error('Check the Atlas cluster hostname and DNS/network settings. Try the SRV lookup from another network or DNS resolver.');
  } else if (codes.some((code) => ['ECONNREFUSED', 'ETIMEDOUT', 'EHOSTUNREACH', 'ENETUNREACH'].includes(code))) {
    console.error('Check that the Atlas cluster is available, your IP is allowed in Atlas Network Access, and your network permits outbound connections to MongoDB.');
  } else if (codes.some((code) => [18, 8000].includes(Number(code)))
      || messages.includes('authentication failed') || messages.includes('bad auth')) {
    console.error('Check the Atlas database username and password. URL-encode special characters in the password; do not use your Atlas website login.');
  } else if (messages.includes('mongoserverselectionerror')) {
    console.error('The driver could not select an Atlas server. Check Atlas Network Access, cluster status, and whether your network or firewall blocks MongoDB connections.');
  } else {
    console.error('Verify MONGO_URI and review the error details above. Do not share the URI because it contains database credentials.');
  }
};

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    const error = new Error('MONGO_URI is not set. Add it to the project .env file.');
    logConnectionFailure(error);
    throw error;
  }

  let connectionInfo;
  try {
    connectionInfo = getConnectionInfo(uri);
  } catch (error) {
    logConnectionFailure(error);
    throw error;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    logConnectionFailure(error, connectionInfo);
    throw error;
  }
};

module.exports = connectDB;
