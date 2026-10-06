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

async function recoverFast() {
  console.log('=== STARTING HIGH-SPEED SAFE CONFIRMATION BACKLOG RECOVERY ===');
  let iteration = 0;
  let totalConfirmationSent = 0;
  let totalApologySent = 0;
  let consecutiveZeroes = 0;

  while (true) {
    iteration++;
    try {
      const res = await fetch(`${PROD_URL}/api/admin/retry-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_SECRET}`
        },
        body: JSON.stringify({ action: 'resend-remaining' })
      });

      if (!res.ok) {
        console.error(`[Batch ${iteration} Error] HTTP ${res.status}: ${await res.text()}`);
        await new Promise(r => setTimeout(r, 4000));
        continue;
      }

      const data = await res.json();
      const confSent = data.confirmationSent || 0;
      const apSent = data.apologySent || 0;
      const attempted = data.attempted || 0;
      const remaining = data.remaining || 0;

      totalConfirmationSent += confSent;
      totalApologySent += apSent;

      console.log(`[Batch ${iteration}] Attempted: ${attempted} | Confirmation Sent: ${confSent} | Apology Sent: ${apSent} | Remaining Backlog: ${remaining}`);

      if (attempted === 0 || remaining === 0) {
        console.log('\n🎉 BACKLOG RECOVERY FULLY COMPLETED! Remaining eligible backlog = 0.');
        break;
      }

      if (confSent === 0 && apSent === 0) {
        consecutiveZeroes++;
        if (consecutiveZeroes >= 4) {
          console.log('\n[Recovery Queue Paused] 4 consecutive batches returned 0 sent items. Rate limit or queue empty.');
          break;
        }
      } else {
        consecutiveZeroes = 0;
      }

      // 1.5s delay between batches
      await new Promise(r => setTimeout(r, 1500));

    } catch (e) {
      console.error(`[Batch ${iteration} Exception]:`, e.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  console.log('\n=== RECOVERY SESSION SUMMARY ===');
  console.log(`- Total Confirmation Emails Recovered: ${totalConfirmationSent}`);
  console.log(`- Total Apology Notifications Sent: ${totalApologySent}`);
}

recoverFast().catch(console.error);
