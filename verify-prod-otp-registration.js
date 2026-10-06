// Node.js script to perform ONE controlled live OTP verification & registration test on production
const PROD_BASE = 'https://exousia-vert.vercel.app';
const TEST_EMAIL = 'mohammadashikshaik32@gmail.com';

async function runControlledTest() {
  console.log('=== STARTING CONTROLLED LIVE OTP & REGISTRATION TEST ===');
  console.log(`Target Environment: ${PROD_BASE}`);
  console.log(`Test Email: ${TEST_EMAIL}`);

  // Step 1: Send OTP
  console.log('\n[Step 1] Triggering POST /api/email/send-otp...');
  const sendRes = await fetch(`${PROD_BASE}/api/email/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL })
  });

  const sendData = await sendRes.json();
  console.log(`Send OTP HTTP Status: ${sendRes.status}`);
  console.log('Send OTP Response:', sendData);

  if (!sendRes.ok || !sendData.success) {
    console.error('❌ Step 1 Failed! Could not send OTP.');
    process.exit(1);
  }

  console.log('✅ Step 1 Passed! OTP sent via Gmail API.');
}

runControlledTest().catch(console.error);
