// One-time Pushover setup: logs in, registers this app as an Open Client
// device, and writes the secret + device id to .env.local.
// Usage: node scripts/pushover-setup.mjs
import { writeFileSync } from 'node:fs';
import { stdin as input, stdout as output } from 'node:process';
import { createInterface } from 'node:readline/promises';

const API = 'https://api.pushover.net/1';
const headers = { 'User-Agent': 'LockScreen/1.0 (unofficial Pushover Open Client)' };

async function post(path, params) {
  const res = await fetch(API + path, { method: 'POST', headers, body: new URLSearchParams(params) });
  return { status: res.status, json: await res.json() };
}

const rl = createInterface({ input, output });
const email = await rl.question('Pushover email: ');
const password = await rl.question('Pushover password (shown as you type): ');

let login = await post('/users/login.json', { email, password });
if (login.status === 412) {
  const twofa = await rl.question('Two-factor code: ');
  login = await post('/users/login.json', { email, password, twofa });
}
if (login.json.status !== 1) {
  console.error('Login failed:', login.json.errors ?? login.json);
  process.exit(1);
}

const name = (await rl.question('Device name [lockscreen]: ')) || 'lockscreen';
rl.close();

const device = await post('/devices.json', { secret: login.json.secret, name, os: 'O' });
if (device.json.status !== 1) {
  console.error('Device registration failed:', device.json.errors ?? device.json);
  process.exit(1);
}

writeFileSync(
  '.env.local',
  `EXPO_PUBLIC_PUSHOVER_SECRET=${login.json.secret}\nEXPO_PUBLIC_PUSHOVER_DEVICE_ID=${device.json.id}\n`,
);
console.log(`Registered device "${name}". Saved credentials to .env.local (never commit this file).`);
