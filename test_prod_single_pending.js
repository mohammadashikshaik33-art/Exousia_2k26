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

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'EXOUSIA_SECURE_ADMIN_KEY_998877665544332211_PROD';
const PROD_URL = 'https://exousia-vert.vercel.app';

async function testProdSingle() {
  console.log('=== TESTING LIVE PRODUCTION OUTBOX RECOVERY ENDPOINT ===');
  console.log('Target URL:', `${PROD_URL}/api/admin/retry-email`);

  const res = await fetch(`${PROD_URL}/api/admin/retry-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ADMIN_SECRET}`
    },
    body: JSON.stringify({ action: 'resend-remaining' })
  });

  console.log('HTTP Response Status:', res.status, res.statusText);
  if (!res.ok) {
    console.error('Error response body:', await res.text());
    return;
  }

  const data = await res.json();
  console.log('\n--- PRODUCTION RECOVERY BATCH RESPONSE ---');
  console.log(JSON.stringify(data, null, 2));
}

testProdSingle().catch(console.error);
