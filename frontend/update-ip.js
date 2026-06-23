import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    if (/docker|virtual|vbox|vethernet/i.test(name)) continue;

    for (const iface of interfaces[name]) {
      const isIPv4 = iface.family === 'IPv4' || iface.family === 4;
      if (isIPv4 && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const envPath = path.resolve(__dirname, '..', '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
} else {
  console.log(`[Vite Env] Внимание: Файл .env не найден по пути: ${envPath}. Создаю новый.`);
}

const localIp = getLocalIP();
const newVar = `VITE_API_URL=http://${localIp}:8000`;

if (/VITE_API_URL=.*/g.test(envContent)) {
  envContent = envContent.replace(/VITE_API_URL=.*/g, newVar);
} else {
  envContent = envContent.trim() + `\n${newVar}`;
}

fs.writeFileSync(envPath, envContent.trim() + '\n');
console.log(`[Vite Env] Успешно обновлен коренной .env -> VITE_API_URL=http://${localIp}:8000`);
