const dns = require('node:dns');

const servers = (process.env.DNS_SERVERS || '1.1.1.1,1.0.0.1')
  .split(',')
  .map((server) => server.trim())
  .filter(Boolean);

dns.setServers(servers);
