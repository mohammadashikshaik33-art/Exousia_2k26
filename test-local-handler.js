import fs from 'fs';
import coordinatorHandler from './api/coordinator/registrations.js';
import adminHandler from './api/admin/registrations.js';

// Load .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let key = match[1].trim();
    let val = match[2].trim().replace(/^["']|["']$/g, '');
    process.env[key] = val;
  }
});

function createMockReqRes(query, headers = {}) {
  const req = { method: 'GET', query, headers };
  let responseData = null;
  let responseStatus = 200;
  const res = {
    setHeader: () => {},
    status: (code) => {
      responseStatus = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      return res;
    }
  };
  return { req, res, getResult: () => ({ status: responseStatus, data: responseData }) };
}

async function runLocalTests() {
  console.log('=== TESTING LOCAL SERVERLESS HANDLERS ===');

  const COORD_KEYS = {
    "CLUE'D UP": 'COORD-CLUEDUP-2026',
    "HAWKINS TRAP": 'COORD-HAWKINS-2026',
    "DARK PROTOCOL": 'COORD-DARKPROTOCOL-2026',
    "GENOVA": 'COORD-GENOVA-2026'
  };

  for (const [evt, token] of Object.entries(COORD_KEYS)) {
    const { req, res, getResult } = createMockReqRes({ event: evt }, { authorization: `Bearer ${token}` });
    await coordinatorHandler(req, res);
    const { status, data } = getResult();
    console.log(`\nCoordinator Event "${evt}" -> Status: ${status}, Count: ${data?.totalCount}`);
    if (data?.records) {
      data.records.forEach(r => console.log(`  - [${r.registration_id}] ${r.full_name} (${r.selected_event})`));
    }
  }

  // Admin Handler Test
  const { req: adminReq, res: adminRes, getResult: getAdminResult } = createMockReqRes({ event: 'ALL' }, { authorization: `Bearer ${process.env.ADMIN_SECRET_KEY}` });
  await adminHandler(adminReq, adminRes);
  const { status: adminStatus, data: adminData } = getAdminResult();
  console.log(`\nAdmin Event "ALL" -> Status: ${adminStatus}, Total: ${adminData?.total}`);
  console.log('Metrics per event:', adminData?.metrics?.byEvent);
}

runLocalTests().catch(console.error);
