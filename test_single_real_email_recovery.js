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

loadEnv('.env.production');
loadEnv('.env.local');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminSecret = process.env.ADMIN_SECRET_KEY || 'EXOUSIA_SECURE_ADMIN_KEY_998877665544332211_PROD';
const prodUrl = 'https://exousia-vert.vercel.app';

async function testSingleRealEmail() {
  console.log('=== PHASE 3 — ONE REAL EMAIL PRODUCTION SAFETY TEST ===');

  // 1. Fetch 1 failed confirmation email row from outbox
  const fetchRes = await fetch(
    `${supabaseUrl}/rest/v1/email_outbox?status=in.(pending,failed)&recipient=neq.SYSTEM_CAMPAIGN&recipient=neq.FEEDBACK_RESPONSE&order=created_at.asc&limit=20`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  );

  if (!fetchRes.ok) {
    console.error('Failed to query outbox:', await fetchRes.text());
    process.exit(1);
  }

  const items = await fetchRes.json();
  const validItems = items.filter(i => {
    const s = i.subject || '';
    return !s.includes('Confirmation Email Update') && !s.includes('apology') && !s.includes('Fell Through a Portal');
  });

  if (validItems.length === 0) {
    console.log('No pending/failed confirmation items found in outbox.');
    process.exit(0);
  }

  const targetItem = validItems[0];
  console.log('\n[Target Outbox Row Selected]:');
  console.log('  - Outbox ID:', targetItem.id);
  console.log('  - Recipient:', targetItem.recipient);
  console.log('  - Registration DB ID:', targetItem.registration_id);
  console.log('  - Current Status:', targetItem.status);
  console.log('  - Initial Error:', targetItem.error_message);

  // Check outbox row count for this registration BEFORE test
  const preCountRes = await fetch(
    `${supabaseUrl}/rest/v1/email_outbox?registration_id=eq.${targetItem.registration_id}&select=id,subject,status`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  );
  const preRows = preCountRes.ok ? await preCountRes.json() : [];
  console.log('  - Initial outbox row count for registration:', preRows.length);

  // 2. Execute resend-single via production API endpoint
  console.log('\n[Dispatching Single Test Request to Production API...]');
  const apiRes = await fetch(`${prodUrl}/api/admin/retry-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminSecret}`
    },
    body: JSON.stringify({
      action: 'resend-single',
      targetOutboxId: targetItem.id
    })
  });

  const apiStatus = apiRes.status;
  const apiData = await apiRes.json();

  console.log(`[Production API Response]: HTTP ${apiStatus}`);
  console.log(JSON.stringify(apiData, null, 2));

  // 3. Verify Database Post-Condition
  await new Promise(r => setTimeout(r, 2000));

  const verifyRes = await fetch(
    `${supabaseUrl}/rest/v1/email_outbox?id=eq.${targetItem.id}&select=*`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  );
  const updatedRows = verifyRes.ok ? await verifyRes.json() : [];
  const updatedItem = updatedRows[0];

  console.log('\n=== VERIFICATION RESULTS ===');
  console.log('1. Updated Outbox Status:', updatedItem?.status);
  console.log('2. Updated Sent At:', updatedItem?.sent_at);
  console.log('3. Updated Error Message:', updatedItem?.error_message);

  // Check duplicate rows after test
  const postCountRes = await fetch(
    `${supabaseUrl}/rest/v1/email_outbox?registration_id=eq.${targetItem.registration_id}&select=id,subject,status`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  );
  const postRows = postCountRes.ok ? await postCountRes.json() : [];
  console.log('4. Post-test outbox row count for registration:', postRows.length);

  const passed = (
    updatedItem?.status === 'sent' &&
    Boolean(updatedItem?.sent_at) &&
    postRows.length === preRows.length
  );

  if (passed) {
    console.log('\n✅ PHASE 3 SINGLE-EMAIL SAFETY TEST PASSED PERFECTLY!');
  } else {
    console.error('\n❌ PHASE 3 SAFETY TEST FAILED!');
    process.exit(1);
  }
}

testSingleRealEmail().catch(console.error);
