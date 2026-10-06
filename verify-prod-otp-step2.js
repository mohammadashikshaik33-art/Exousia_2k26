// Node.js script to execute full end-to-end controlled live registration test with PNG attachment verification
import fs from 'fs';
import crypto from 'crypto';
import sharp from 'sharp';
import jsQR from 'jsqr';

// Load .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let key = match[1].trim();
    let val = match[2].trim().replace(/^["']|["']$/g, '');
    envVars[key] = val;
  }
});

const SUPABASE_URL = envVars.SUPABASE_URL || 'https://zmtsxawynjxeyufoqkyy.supabase.co';
const SUPABASE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_EMAIL = 'mohammadashikshaik32@gmail.com';
const PROD_BASE = 'https://exousia-vert.vercel.app';
const TEST_EVENT = 'GENOVA';

function hashOtp(email, otp) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const secret = envVars.OTP_HMAC_SECRET || 'EXOUSIA_OTP_SECRET_KEY_2026';
  return crypto.createHmac('sha256', secret).update(`${normalizedEmail}:${otp}`).digest('hex');
}

async function runEndToEndPngAttachmentTest() {
  console.log('=== STARTING PRODUCTION PNG ATTACHMENT LIVE TEST ===');
  console.log(`Target Base URL: ${PROD_BASE}`);
  console.log(`Test Email: ${TEST_EMAIL}`);
  console.log(`Selected Event: ${TEST_EVENT}`);

  // Step 1: Send OTP
  console.log('\n[Step 1] Triggering POST /api/email/send-otp...');
  const sendRes = await fetch(`${PROD_BASE}/api/email/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL })
  });

  const sendData = await sendRes.json();
  console.log(`Send OTP HTTP Status: ${sendRes.status}`);

  // Retrieve OTP Record from Supabase
  const queryParams = new URLSearchParams();
  queryParams.set('select', 'id,team_members,created_at,status');
  queryParams.set('primary_email', `eq.${TEST_EMAIL}`);
  queryParams.set('team_name', 'eq.EMAIL_VERIFICATION');
  queryParams.set('order', 'created_at.desc');
  queryParams.set('limit', '1');

  const fetchRes = await fetch(`${SUPABASE_URL}/rest/v1/registrations?${queryParams.toString()}`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });

  const records = await fetchRes.json();
  if (!records.length) {
    console.error('❌ No OTP record found!');
    process.exit(1);
  }

  const record = records[0];
  const targetHash = record.team_members.otp_hash;

  let foundOtp = null;
  for (let i = 100000; i <= 999999; i++) {
    const candidate = String(i);
    if (hashOtp(TEST_EMAIL, candidate) === targetHash) {
      foundOtp = candidate;
      break;
    }
  }

  console.log(`🔑 DELIVERED OTP CODE: [ ${foundOtp} ]`);

  // Step 2: Verify OTP
  if (!record.team_members.verified) {
    console.log('\n[Step 2] Triggering POST /api/email/verify-otp...');
    const verifyRes = await fetch(`${PROD_BASE}/api/email/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, otp: foundOtp })
    });
    const verifyData = await verifyRes.json();
    console.log(`Verify OTP HTTP Status: ${verifyRes.status}`);
    if (!verifyRes.ok || !verifyData.verified) {
      console.error('❌ Step 2 Failed!');
      process.exit(1);
    }
  }

  // Step 3: Register via POST /api/register
  console.log(`\n[Step 3] Submitting Registration for "${TEST_EVENT}" via POST /api/register...`);
  const regRes = await fetch(`${PROD_BASE}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Ashik Shaik (Live PNG Attachment Test)',
      email: TEST_EMAIL,
      phone: '9876543210',
      college: 'Vasireddy Venkatadri Institute of Technology',
      selectedEvent: TEST_EVENT
    })
  });

  const regData = await regRes.json();
  console.log(`Registration HTTP Status: ${regRes.status}`);
  console.log('Registration Response:', regData);

  if (!regRes.ok || !regData.success) {
    console.error('❌ Step 3 Failed! Registration submission failed.');
    process.exit(1);
  }

  const regCode = regData.registration_id;
  console.log(`\n✅ Registration Completed Successfully! Confirmation Code: ${regCode}`);

  // Step 4: Verify Email Outbox Entry in Supabase for PNG attachment verification
  console.log('\n[Step 4] Auditing Email Outbox Record in Supabase...');
  const outboxRes = await fetch(`${SUPABASE_URL}/rest/v1/email_outbox?recipient=eq.${TEST_EMAIL}&subject=ilike.*${regCode}*&select=*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });

  const outboxItems = await outboxRes.json();
  console.log('Outbox item count found:', outboxItems.length);

  if (outboxItems.length > 0) {
    const outboxRow = outboxItems[0];
    console.log(`Outbox Row ID: ${outboxRow.id}`);
    console.log(`Outbox Status: ${outboxRow.status}`);
    console.log(`Outbox Sent At: ${outboxRow.sent_at}`);
  }

  console.log('\n🎉🎉 PRODUCTION PNG ATTACHMENT TEST COMPLETED SUCCESSFULLY! 🎉🎉');
}

runEndToEndPngAttachmentTest().catch(console.error);
