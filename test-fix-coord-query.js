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

async function testFixCoordQuery() {
  console.log('=== TESTING PROPER POSTGREST EVENT FILTERS (NO DOUBLE ENCODING) ===');

  const events = ["CLUE'D UP", "HAWKINS TRAP", "DARK PROTOCOL", "GENOVA"];

  for (const evt of events) {
    const params = new URLSearchParams();
    params.set('select', 'id,confirmation_code,primary_name,team_name');
    params.set('team_name', 'neq.EMAIL_VERIFICATION');

    if (evt === 'GENOVA' || evt === 'NEXORA') {
      params.set('or', '(team_name.ilike.*GENOVA*,team_name.ilike.*NEXORA*)');
    } else if (evt === 'DARK PROTOCOL' || evt === 'DARK PORTAL') {
      params.set('or', '(team_name.ilike.*DARK PROTOCOL*,team_name.ilike.*DARK PORTAL*)');
    } else {
      params.set('team_name', `ilike.*${evt}*`);
    }

    const url = `${SUPABASE_URL}/rest/v1/registrations?${params.toString()}`;
    console.log(`\nEvent: "${evt}"`);
    console.log(`URL: ${url}`);

    const res = await fetch(url, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });

    const rows = await res.json();
    console.log(`Matching records count: ${rows.length}`);
    rows.forEach(r => console.log(`  - [${r.confirmation_code}] ${r.primary_name} (${r.team_name})`));
  }
}

testFixCoordQuery().catch(console.error);
