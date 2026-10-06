import fs from 'fs';

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = val;
      }
    }
  });
}

loadEnv('.env.production.local');
loadEnv('.env.production');
loadEnv('.env.local');

import { sendGmailEmail } from './lib/gmail.js';

async function testLocalSend() {
  console.log('Client ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'MISSING');
  console.log('Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING');
  console.log('google_refresh_token:', process.env.google_refresh_token ? 'SET' : 'MISSING');

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: (process.env.GOOGLE_CLIENT_ID || '').trim(),
      client_secret: (process.env.GOOGLE_CLIENT_SECRET || '').trim(),
      refresh_token: (process.env.google_refresh_token || '').trim(),
      grant_type: 'refresh_token'
    }).toString()
  });

  console.log('Token Refresh HTTP Status:', tokenRes.status);
  const text = await tokenRes.text();
  console.log('Token Refresh Body:', text);
}

testLocalSend().catch(console.error);
