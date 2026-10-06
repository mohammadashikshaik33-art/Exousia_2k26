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

async function checkTables() {
  console.log('=== AUDITING PRODUCTION SUPABASE DATABASE ===');
  console.log(`URL: ${SUPABASE_URL}`);

  // Test email_verifications table
  const evRes = await fetch(`${SUPABASE_URL}/rest/v1/email_verifications?select=*&limit=1`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  
  console.log(`email_verifications table check HTTP status: ${evRes.status}`);
  if (evRes.ok) {
    console.log('✅ email_verifications table EXISTS!');
  } else {
    const txt = await evRes.text();
    console.log(`❌ email_verifications table DOES NOT EXIST or Error: ${txt}`);
  }

  // Test registrations table
  const regRes = await fetch(`${SUPABASE_URL}/rest/v1/registrations?select=id,registration_kind,status,team_name,primary_email&limit=3`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  console.log(`registrations table check HTTP status: ${regRes.status}`);
  if (regRes.ok) {
    const rows = await regRes.json();
    console.log('Sample registrations rows count:', rows.length);
  }
}

checkTables().catch(console.error);
