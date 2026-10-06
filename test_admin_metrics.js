import fs from 'fs';

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = val;
      }
    }
  });
}

loadEnv('.env.production');
loadEnv('.env.local');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkRealMetrics() {
  let allEventsData = [];
  let metricPage = 0;
  const metricLimit = 1000;
  while (true) {
    const mRes = await fetch(
      `${supabaseUrl}/rest/v1/registrations?status=eq.confirmed&team_name=neq.EMAIL_VERIFICATION&select=team_name,registration_kind&limit=${metricLimit}&offset=${metricPage * metricLimit}`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );
    if (!mRes.ok) break;
    const pageData = await mRes.json();
    allEventsData = allEventsData.concat(pageData);
    if (pageData.length < metricLimit) break;
    metricPage++;
  }

  console.log('=== REAL PARTICIPANT REGISTRATION METRICS ===');
  console.log('TOTAL REAL CONFIRMED PARTICIPANTS:', allEventsData.length);

  const byTrack = {
    "CLUE'D UP": 0,
    "HAWKINS TRAP": 0,
    "DARK PORTAL": 0,
    "DARK PROTOCOL": 0,
    "GENOVA": 0,
    "NEXORA": 0
  };

  allEventsData.forEach(row => {
    const track = (row.team_name || row.registration_kind || '').toUpperCase();
    if (track.includes("CLUE'D UP") || track.includes('CLUE')) byTrack["CLUE'D UP"]++;
    else if (track.includes('HAWKINS TRAP') || track.includes('HAWKINS')) byTrack["HAWKINS TRAP"]++;
    else if (track.includes('DARK PORTAL')) byTrack["DARK PORTAL"]++;
    else if (track.includes('DARK PROTOCOL') || track.includes('DARK')) byTrack["DARK PROTOCOL"]++;
    else if (track.includes('GENOVA')) byTrack["GENOVA"]++;
    else if (track.includes('NEXORA')) byTrack["NEXORA"]++;
  });

  console.log('Normalized Track Breakdown:', byTrack);
}

checkRealMetrics().catch(console.error);
