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

const PROD_BASE = 'https://exousia-vert.vercel.app';

const TOKENS = {
  "CLUE'D UP": envVars.COORDINATOR_KEY_CLUEDUP || 'COORD-CLUEDUP-2026',
  "HAWKINS TRAP": envVars.COORDINATOR_KEY_HAWKINS || 'COORD-HAWKINS-2026',
  "DARK PROTOCOL": envVars.COORDINATOR_KEY_DARKPROTOCOL || 'COORD-DARKPROTOCOL-2026',
  "GENOVA": envVars.COORDINATOR_KEY_GENOVA || 'COORD-GENOVA-2026'
};

async function testCoordinatorApi() {
  console.log('=== TESTING COORDINATOR API ENDPOINTS ===');

  for (const [evt, token] of Object.entries(TOKENS)) {
    const url = `${PROD_BASE}/api/coordinator/registrations?event=${encodeURIComponent(evt)}`;
    console.log(`\nFetching ${evt} with token ${token}...`);
    console.log(`URL: ${url}`);

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`HTTP Status: ${res.status}`);
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  }
}

testCoordinatorApi().catch(console.error);
