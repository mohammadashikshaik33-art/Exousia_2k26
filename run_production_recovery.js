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

async function fetchLiveMetrics() {
  try {
    const res = await fetch(`${PROD_URL}/api/admin/retry-email?action=metrics`, {
      headers: { Authorization: `Bearer ${ADMIN_SECRET}` }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function runRecoveryLoop() {
  console.log('===========================================================');
  console.log('EXOUSIA 2K26 — CONTINUOUS APOLOGY + CONFIRMATION RECOVERY WORKER');
  console.log('Priority: APOLOGY QUEUE FIRST -> CONFIRMATION QUEUE SECOND');
  console.log('===========================================================');

  let batchNum = 0;
  let totalApologySentSession = 0;
  let totalConfSentSession = 0;
  let consecutiveZeroes = 0;

  while (true) {
    batchNum++;
    const before = await fetchLiveMetrics();

    console.log(`\n===========================================================`);
    console.log(`--- BATCH ${batchNum} BEFORE STATE ---`);
    console.log(`  REAL CONFIRMED PARTICIPANTS : ${before?.totalRegistered}`);
    console.log(`  APOLOGY SENT                : ${before?.apologySent}`);
    console.log(`  APOLOGY FAILED/REMAINING    : ${before?.apologyFailed}`);
    console.log(`  CONFIRMATION SENT           : ${before?.confirmationSent}`);
    console.log(`  CONFIRMATION REMAINING      : ${before?.confirmationPending}`);
    console.log(`  CONFIRMATION FAILED         : ${before?.confirmationFailed}`);

    if (before && before.apologyFailed === 0 && before.confirmationPending === 0) {
      console.log('\n🎉 ALL APOLOGY & CONFIRMATION BACKLOG FULLY RECOVERED!');
      break;
    }

    const res = await fetch(`${PROD_URL}/api/admin/retry-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_SECRET}`
      },
      body: JSON.stringify({ action: 'resend-remaining', limit: 2 })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Batch ${batchNum} Error] HTTP ${res.status}: ${errText}`);
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }

    const data = await res.json();
    const confSent = data.confirmationSent || 0;
    const apSent = data.apologySent || 0;
    const attempted = data.attempted || 0;

    totalConfSentSession += confSent;
    totalApologySentSession += apSent;

    if (data.logs && data.logs.length > 0) {
      data.logs.forEach(l => {
        console.log(`   -> Recipient: ${l.recipient} | Status: ${l.status} | Sender/Details: ${l.sender || l.error || 'N/A'}`);
      });
    }

    await new Promise(r => setTimeout(r, 1000));
    const after = await fetchLiveMetrics();

    console.log(`--- BATCH ${batchNum} AFTER STATE ---`);
    console.log(`  ATTEMPTED THIS BATCH        : ${attempted}`);
    console.log(`  APOLOGY SENT THIS BATCH     : ${apSent}`);
    console.log(`  CONF SENT THIS BATCH        : ${confSent}`);
    console.log(`  NEW APOLOGY SENT TOTAL      : ${after?.apologySent}`);
    console.log(`  NEW APOLOGY FAILED/REMAINING: ${after?.apologyFailed}`);
    console.log(`  NEW CONFIRMATION SENT TOTAL : ${after?.confirmationSent}`);
    console.log(`  NEW CONFIRMATION REMAINING  : ${after?.confirmationPending}`);
    console.log(`===========================================================`);

    if (attempted === 0) {
      console.log('\n🎉 RECOVERY COMPLETED! No remaining outbox items.');
      break;
    }

    if (confSent === 0 && apSent === 0) {
      consecutiveZeroes++;
      console.warn(`[Batch Warning] 0 items sent in batch ${batchNum} (Attempted: ${attempted}). Google Rate Limit active. Pausing 30s... (Zero count: ${consecutiveZeroes})`);
      await new Promise(r => setTimeout(r, 30000));
    } else {
      consecutiveZeroes = 0;
      // Stagger 3.5s between batches
      await new Promise(r => setTimeout(r, 3500));
    }
  }

  console.log('\n===========================================================');
  console.log('RECOVERY WORKER SUMMARY');
  console.log(`- Total Apology Emails Recovered: ${totalApologySentSession}`);
  console.log(`- Total Confirmation Emails Recovered: ${totalConfSentSession}`);
  console.log('===========================================================');
}

runRecoveryLoop().catch(console.error);
