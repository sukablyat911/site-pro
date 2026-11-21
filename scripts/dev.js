const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const client = path.join(root, 'client');
const commands = [
  {
    name: 'server',
    cwd: root,
    script: path.join(root, 'node_modules', 'nodemon', 'bin', 'nodemon.js'),
    args: ['server/server.js'],
  },
  {
    name: 'client',
    cwd: client,
    script: path.join(client, 'node_modules', 'vite', 'bin', 'vite.js'),
    args: [],
  },
];

let stopping = false;
const children = commands.map(({ name, cwd, script, args }) => {
  const child = spawn(process.execPath, [script, ...args], {
    cwd,
    stdio: 'inherit',
    windowsHide: true,
  });

  child.on('error', (error) => {
    console.error(`[${name}] Failed to start: ${error.message}`);
    stop(1);
  });

  child.on('exit', (code, signal) => {
    if (!stopping) {
      if (signal) {
        console.error(`[${name}] exited due to signal ${signal}`);
      } else {
        console.error(`[${name}] exited with code ${code}`);
      }
      stop(code === 0 ? 1 : code || 1);
    }
  });

  return child;
});

function stop(exitCode) {
  if (stopping) return;

  stopping = true;
  process.exitCode = exitCode;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill();
    }
  }
}

process.on('SIGINT', () => stop(130));
process.on('SIGTERM', () => stop(143));
