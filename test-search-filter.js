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

async function testSearchFilter() {
  console.log('=== TESTING POSTGREST SEARCH + EVENT COMBINED FILTERS ===');

  // Test searching "Mohammad" inside DARK PROTOCOL (which matches DARK PORTAL / DARK PROTOCOL)
  const searchPattern = '*Mohammad*';
  const eventCond = 'or(team_name.ilike.*DARK PROTOCOL*,team_name.ilike.*DARK PORTAL*)';
  const searchCond = `or(confirmation_code.ilike.${searchPattern},primary_name.ilike.${searchPattern},primary_email.ilike.${searchPattern},primary_college.ilike.${searchPattern})`;
  const queryStr = `team_name=neq.EMAIL_VERIFICATION&and=(${eventCond},${searchCond})`;

  console.log('Query String:', queryStr);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/registrations?${queryStr}&select=id,confirmation_code,primary_name,team_name`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });

  const rows = await res.json();
  console.log(`Search Result (${rows.length} rows):`);
  rows.forEach(r => console.log(`  - [${r.confirmation_code}] ${r.primary_name} -> Event: ${r.team_name}`));
}

testSearchFilter().catch(console.error);
