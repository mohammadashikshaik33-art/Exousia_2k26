import fs from 'fs';

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
const SUPABASE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

async function cleanupTestData() {
  console.log('=== CLEANING UP CONTROLLED TEST REGISTRATION ===');
  const targetCode = 'EX-2026-Q39KR3';

  // 1. Delete registration row
  console.log(`Deleting registration where confirmation_code = '${targetCode}'...`);
  const delRes = await fetch(`${SUPABASE_URL}/rest/v1/registrations?confirmation_code=eq.${targetCode}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation'
    }
  });

  const deletedRows = await delRes.json();
  console.log('Deleted Registration Rows:', deletedRows);

  // 2. Delete OTP verification temporary record
  console.log(`Deleting test OTP records for primary_email = 'mohammadashikshaik32@gmail.com'...`);
  const delOtpRes = await fetch(`${SUPABASE_URL}/rest/v1/registrations?primary_email=eq.mohammadashikshaik32@gmail.com&team_name=eq.EMAIL_VERIFICATION`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation'
    }
  });
  const deletedOtps = await delOtpRes.json();
  console.log('Deleted OTP Records:', deletedOtps);

  // 3. Verify counts
  const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/registrations?confirmation_code=eq.${targetCode}&select=count`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'count=exact'
    }
  });
  console.log('Check Count HTTP Status:', checkRes.status);
  const countHeader = checkRes.headers.get('content-range');
  console.log('Remaining Registration Count (Content-Range):', countHeader);

  console.log('✅ Cleanup finished successfully.');
}

cleanupTestData().catch(console.error);
