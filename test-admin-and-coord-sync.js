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
const ADMIN_SECRET = envVars.ADMIN_SECRET_KEY || 'EXOUSIA_ADMIN_SECRET_KEY_2026_PROD_ACCESS';

const COORD_TOKENS = {
  "CLUE'D UP": envVars.COORDINATOR_KEY_CLUEDUP || 'COORD-CLUEDUP-2026',
  "HAWKINS TRAP": envVars.COORDINATOR_KEY_HAWKINS || 'COORD-HAWKINS-2026',
  "DARK PROTOCOL": envVars.COORDINATOR_KEY_DARKPROTOCOL || 'COORD-DARKPROTOCOL-2026',
  "GENOVA": envVars.COORDINATOR_KEY_GENOVA || 'COORD-GENOVA-2026'
};

async function testSync() {
  console.log('=== VERIFYING ADMIN AND COORDINATOR CROSS-PORTAL CONSISTENCY ===');

  // 1. Admin ALL registrations count
  const adminRes = await fetch(`${PROD_BASE}/api/admin/registrations?event=ALL`, {
    headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
  });
  const adminData = await adminRes.json();
  console.log(`\n[Admin Portal] Total Live Registrations: ${adminData.total}`);
  console.log(`[Admin Portal] Metrics per Event:`, adminData.metrics?.byEvent);

  // 2. Coordinator counts per event
  console.log('\n[Coordinator Portals] Event Roster Counts:');
  let sumCoordCounts = 0;
  for (const [evt, token] of Object.entries(COORD_TOKENS)) {
    const res = await fetch(`${PROD_BASE}/api/coordinator/registrations?event=${encodeURIComponent(evt)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log(`  - ${evt}: ${data.totalCount} records (HTTP ${res.status})`);
    if (data.records) {
      data.records.forEach(r => console.log(`      * [${r.registration_id}] ${r.full_name} (${r.selected_event})`));
    }
  }
}

testSync().catch(console.error);
