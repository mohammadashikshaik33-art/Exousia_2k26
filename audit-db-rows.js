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

async function auditDb() {
  console.log('=== AUDITING PRODUCTION SUPABASE DATABASE ===');
  console.log('Target URL:', SUPABASE_URL);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/registrations?select=id,confirmation_code,primary_name,primary_email,primary_college,team_name,created_at,status&order=created_at.desc`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });

  const rows = await res.json();
  console.log(`Total Live Registrations in DB: ${rows.length}`);
  
  const eventCounts = {};
  rows.forEach(r => {
    const event = r.team_name || 'UNSPECIFIED';
    eventCounts[event] = (eventCounts[event] || 0) + 1;
    console.log(`- [${r.confirmation_code}] Name: "${r.primary_name}" | Email: "${r.primary_email}" | Event: "${r.team_name}" | Status: "${r.status}"`);
  });

  console.log('\n=== LIVE EVENT BREAKDOWN IN DB ===');
  console.table(eventCounts);
}

auditDb().catch(console.error);
