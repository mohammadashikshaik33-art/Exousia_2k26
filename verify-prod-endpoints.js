const PROD_BASE = 'https://exousia-vert.vercel.app';

async function checkEndpoints() {
  console.log('=== VERIFYING PRODUCTION ENDPOINTS ===');
  const routes = [
    '/',
    '/api/status',
    '/admin',
    '/coordinator',
    '/verify'
  ];

  for (const r of routes) {
    try {
      const res = await fetch(`${PROD_BASE}${r}`);
      console.log(`Endpoint ${r.padEnd(20)} -> HTTP ${res.status}`);
    } catch (e) {
      console.error(`Endpoint ${r} failed:`, e.message);
    }
  }
}

checkEndpoints().catch(console.error);
