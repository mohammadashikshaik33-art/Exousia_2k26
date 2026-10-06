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

async function testFilters() {
  console.log('=== TESTING POSTGREST REGISTRATION FILTERS ===');

  // 1. Exclude EMAIL_VERIFICATION
  const resAll = await fetch(`${SUPABASE_URL}/rest/v1/registrations?team_name=neq.EMAIL_VERIFICATION&select=id,confirmation_code,primary_name,team_name`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const allRows = await resAll.json();
  console.log(`\nReal Registrations (excluding EMAIL_VERIFICATION): ${allRows.length} rows`);
  allRows.forEach(r => console.log(`  - [${r.confirmation_code}] ${r.primary_name} -> Event: ${r.team_name}`));

  // 2. Event Filters
  const eventsToTest = [
    { name: "CLUE'D UP", query: "team_name=ilike.*CLUE'D UP*&team_name=neq.EMAIL_VERIFICATION" },
    { name: "HAWKINS TRAP", query: "team_name=ilike.*HAWKINS TRAP*&team_name=neq.EMAIL_VERIFICATION" },
    { name: "DARK PROTOCOL", query: "or=(team_name.ilike.*DARK PROTOCOL*,team_name.ilike.*DARK PORTAL*)&team_name=neq.EMAIL_VERIFICATION" },
    { name: "GENOVA", query: "or=(team_name.ilike.*GENOVA*,team_name.ilike.*NEXORA*)&team_name=neq.EMAIL_VERIFICATION" }
  ];

  for (const evt of eventsToTest) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/registrations?${evt.query}&select=id,confirmation_code,primary_name,team_name`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const rows = await res.json();
    console.log(`\nEvent "${evt.name}" Filter Result (${rows.length} rows):`);
    rows.forEach(r => console.log(`  - [${r.confirmation_code}] ${r.primary_name} -> Event: ${r.team_name}`));
  }
}

testFilters().catch(console.error);
