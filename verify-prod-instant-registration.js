// Automated Production Smoke Test for Instant Registration (No OTP Required)
const PROD_URL = 'https://exousia-vert.vercel.app';

async function runProductionSmokeTest() {
  console.log('--- STARTING PRODUCTION INSTANT REGISTRATION SMOKE TEST ---');
  console.log('Target Production URL:', PROD_URL);

  const testEmail = `test_instant_${Date.now()}@vvit.ac.in`;
  const payload = {
    fullName: 'Production Instant Registration Smoke Test',
    email: testEmail,
    phone: '9876543210',
    college: 'VVIT University',
    selectedEvent: "CLUE'D UP"
  };

  console.log('1. Submitting direct registration payload without prior OTP verification...');
  try {
    const res = await fetch(`${PROD_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log('HTTP Status:', res.status);
    console.log('Response Payload:', JSON.stringify(data, null, 2));

    if ((res.status === 200 || res.status === 201) && data.success && data.registration_id) {
      console.log('✅ INSTANT REGISTRATION SUCCESSFUL!');
      console.log('Registration ID:', data.registration_id);
      console.log('Status:', data.status);
      console.log('Verification state: PASSED (Instant Registration working seamlessly without OTP requirement).');
    } else {
      console.error('❌ REGISTRATION FAILED:', data);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Exception during registration smoke test:', err);
    process.exit(1);
  }
}

runProductionSmokeTest();
