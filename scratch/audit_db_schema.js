const supabaseUrl = 'https://zmtsxawynjxeyufoqkyy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptdHN4YXd5bmp4ZXl1Zm9xa3l5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njc4MzkxNSwiZXhwIjoyMTAyMzU5OTE1fQ.dEGYxVxpv-3kNcrNxGxR1h3gUzfrGtzMpyWFpX2n_Ac';

async function auditSchema() {
  console.log('=== 1. FETCHING OPENAPI SCHEMA FROM SUPABASE REST API ===');
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });

  if (!res.ok) {
    console.error('Failed to fetch OpenAPI schema:', res.status, await res.text());
    return;
  }

  const openapi = await res.json();
  console.log('Tables exposed in OpenAPI schema:');
  const definitions = openapi.definitions || {};
  Object.keys(definitions).forEach(tableName => {
    console.log(`\nTable: ${tableName}`);
    const props = definitions[tableName].properties || {};
    Object.keys(props).forEach(col => {
      const details = props[col];
      console.log(`  - ${col}: type=${details.type || details.format} (format=${details.format || 'none'}, description=${details.description || ''})`);
    });
  });

  console.log('\n=== 2. ROW COUNTS & SAMPLE SIZES ===');
  const tables = Object.keys(definitions);
  for (const table of tables) {
    const r = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'count=exact'
      }
    });
    if (r.ok) {
      const cr = r.headers.get('content-range');
      const data = await r.json();
      console.log(`Table '${table}': count header = ${cr}, sample row keys = ${data[0] ? Object.keys(data[0]).join(', ') : 'empty'}`);
      if (data[0]) {
        console.log(`  Sample row JSON size: ${JSON.stringify(data[0]).length} bytes`);
      }
    } else {
      console.log(`Table '${table}': error ${r.status}`);
    }
  }
}

auditSchema().catch(console.error);
