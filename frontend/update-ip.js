import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(interfaces)) {
    if (/docker|virtual|vbox|vethernet/i.test(name)) continue;

    for (const iface of interfaces[name]) {
      const isIPv4 = iface.family === 'IPv4' || iface.family === 4;
      if (!isIPv4 || iface.internal) continue;

      const address = iface.address;
      // 169.254.x.x — служебный адрес Windows без DHCP, часто ломает API/CORS.
      if (address.startsWith('169.254.')) continue;

      candidates.push(address);
    }
  }

  const preferred = candidates.find((ip) => ip.startsWith('192.168.') || ip.startsWith('10.'));
  return preferred || candidates[0] || '127.0.0.1';
}

const envPath = path.resolve(__dirname, '..', '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
} else {
  console.log(`[Vite Env] Внимание: Файл .env не найден по пути: ${envPath}. Создаю новый.`);
}

const isHttps = process.argv.includes('--https');

const protocol = isHttps ? 'https' : 'http';

const localIp = getLocalIP();

const apiVar = `VITE_API_URL=${protocol}://${localIp}:8000`;
const httpsVar = `VITE_HTTPS=${isHttps}`;

if (/VITE_API_URL=.*/g.test(envContent)) {
  envContent = envContent.replace(/VITE_API_URL=.*/g, apiVar);
} else {
  envContent = envContent.trim() + `\n${apiVar}`;
}

if (/VITE_HTTPS=.*/g.test(envContent)) {
  envContent = envContent.replace(/VITE_HTTPS=.*/g, httpsVar);
} else {
  envContent = envContent.trim() + `\n${httpsVar}`;
}

fs.writeFileSync(envPath, envContent.trim() + '\n');
console.log(`[Vite Env] Успешно обновлен коренной .env -> ${apiVar} и ${httpsVar}`);
