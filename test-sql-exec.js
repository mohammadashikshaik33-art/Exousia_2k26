import fs from 'fs';

// Load .env.local
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

const ddl = `
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON public.email_verifications (email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_created ON public.email_verifications (created_at DESC);
`;

async function trySql() {
  console.log('Testing SQL DDL execution methods...');

  // Method 1: Supabase Management / Query API
  try {
    const res = await fetch(`${SUPABASE_URL}/pg`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: ddl })
    });
    console.log('Method 1 /pg status:', res.status, await res.text());
  } catch (e) {
    console.log('Method 1 failed:', e.message);
  }

  // Method 2: RPC SQL
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: ddl })
    });
    console.log('Method 2 /rpc/exec_sql status:', res.status, await res.text());
  } catch (e) {
    console.log('Method 2 failed:', e.message);
  }
}

trySql().catch(console.error);
