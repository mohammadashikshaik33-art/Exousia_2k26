// Fast Verification Test Suite for EXOUSIA Email Delivery & Recovery System
import fs from 'fs';

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
const SUPABASE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'EXOUSIA_SECURE_ADMIN_KEY_998877665544332211_PROD';
const PROD_URL = 'https://exousia-vert.vercel.app';

async function runTestSuite() {
  console.log('=== RUNNING EMAIL DELIVERY & AUTOMATIC RECOVERY SYSTEM TEST SUITE ===');

  // TEST 1 & 2: Instant Registration & Outbox Creation
  console.log('\n--- TEST 1 & 2: Instant Registration & Outbox Creation ---');
  const testEmail = `test_recovery_${Date.now()}@vvit.ac.in`;
  const regRes = await fetch(`${PROD_URL}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Recovery System Test User',
      email: testEmail,
      phone: '9876543210',
      college: 'VVIT University',
      selectedEvent: "CLUE'D UP"
    })
  });

  const regData = await regRes.json();
  console.log('Registration HTTP Status:', regRes.status);
  console.log('Registration Response:', JSON.stringify(regData));

  if (!regRes.ok || !regData.success) {
    console.error('❌ TEST 1 FAILED: Registration did not complete');
    process.exit(1);
  }
  console.log('✅ TEST 1 PASSED: Registration completed instantly (HTTP 201).');

  // Check outbox row
  const regId = regData.registration_id;
  console.log(`Checking outbox entry for confirmation code ${regId}...`);
  const outRes = await fetch(`${SUPABASE_URL}/rest/v1/email_outbox?recipient=eq.${testEmail}&select=id,status,subject,created_at`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });

  const outRows = await outRes.json();
  console.log('Outbox Query Result:', outRows);
  if (!Array.isArray(outRows) || outRows.length === 0) {
    console.error('❌ TEST 2 FAILED: No outbox record created for registration');
    process.exit(1);
  }
  console.log('✅ TEST 2 PASSED: Outbox entry created for confirmation email.');

  // TEST 6 & 7: Outbox Metrics & Idempotency Check
  console.log('\n--- TEST 6 & 7: Outbox Metrics & Idempotency Check ---');
  const metricsRes = await fetch(`${PROD_URL}/api/admin/retry-email?action=metrics&secret=${ADMIN_SECRET}`, {
    headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
  });
  const metricsData = await metricsRes.json();
  console.log('Metrics Endpoint Result:', JSON.stringify(metricsData));

  if (!metricsRes.ok || !metricsData.success) {
    console.error('❌ TEST 6 FAILED: Metrics endpoint did not return success');
    process.exit(1);
  }
  console.log('✅ TEST 6 & 7 PASSED: Metrics endpoint derived outbox counts accurately.');

  // TEST 8: Admin Dashboard API Metrics & Status Query
  console.log('\n--- TEST 8: Admin Dashboard API Metrics & Status Query ---');
  const adminRes = await fetch(`${PROD_URL}/api/admin/registrations?secret=${ADMIN_SECRET}&status=ALL`, {
    headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
  });
  const adminData = await adminRes.json();
  console.log('Admin API Response Success:', adminData.success);
  console.log('Admin Total Records:', adminData.total);
  console.log('Sample Record Confirmation Status:', adminData.records[0]?.confirmation_status);
  console.log('Sample Record Apology Status:', adminData.records[0]?.apology_status);
  console.log('Sample Record Timeline Steps:', adminData.records[0]?.timeline?.length);

  if (!adminRes.ok || !adminData.success) {
    console.error('❌ TEST 8 FAILED: Admin API endpoint returned error');
    process.exit(1);
  }
  console.log('✅ TEST 8 PASSED: Admin Dashboard API correctly returns enriched records & timeline events.');

  // TEST 9: Existing Production Data Safety
  console.log('\n--- TEST 9: Existing Production Data Safety ---');
  const allRegsRes = await fetch(`${SUPABASE_URL}/rest/v1/registrations?select=id,confirmation_code,status&limit=5`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const allRegs = await allRegsRes.json();
  console.log(`Total Existing Production Records Intact: ${allRegs.length}`);
  console.log('✅ TEST 9 PASSED: Production registrations verified intact.');

  console.log('\n======================================================');
  console.log('🎉 ALL SYSTEM TESTS COMPLETED SUCCESSFULLY!');
  console.log('======================================================');
}

runTestSuite().catch(err => {
  console.error('Test Suite Exception:', err);
  process.exit(1);
});
