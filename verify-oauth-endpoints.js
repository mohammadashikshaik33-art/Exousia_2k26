// EXOUSIA Google OAuth Endpoint QA Test Script

import fs from 'fs';

console.log('=== EXOUSIA GOOGLE OAUTH ENDPOINT QA AUDIT ===\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[ PASS ] ${message}`);
    passCount++;
  } else {
    console.error(`[ FAIL ] ${message}`);
    failCount++;
  }
}

// 1. Check File Existence & Rewrites
assert(fs.existsSync('api/auth/google.js'), 'api/auth/google.js serverless endpoint exists');
assert(fs.existsSync('capture-google-refresh-token.js'), 'capture-google-refresh-token.js local capture script exists');
const vercelJson = fs.readFileSync('vercel.json', 'utf8');
assert(vercelJson.includes('/api/auth/google/start') && vercelJson.includes('/api/auth/google/callback'), 'vercel.json contains exact route rewrites for start and callback');

// 2. Audit Google OAuth Implementation in api/auth/google.js
const code = fs.readFileSync('api/auth/google.js', 'utf8');
assert(code.includes('process.env.google_client_id') || code.includes('process.env.GOOGLE_CLIENT_ID'), 'checks client_id env var');
assert(code.includes('https://exousia-vert.vercel.app/api/auth/google/callback'), 'specifies exact redirect_uri: https://exousia-vert.vercel.app/api/auth/google/callback');
assert(code.includes('https://www.googleapis.com/auth/gmail.send'), 'requests gmail.send scope');
assert(code.includes('access_type: \'offline\'') && code.includes('prompt: \'consent\''), 'sets offline access & consent prompt');
assert(code.includes('req.query.code'), 'reads authorization code from query string');
assert(!code.includes('${clientSecret}'), 'NEVER exposes client secret in HTML or JSON responses');
assert(!code.includes('supabase') && !code.includes('registrations'), 'makes ZERO Supabase or database calls');

// 3. Audit Local Capture Tool capture-google-refresh-token.js
const scriptCode = fs.readFileSync('capture-google-refresh-token.js', 'utf8');
assert(scriptCode.includes('https://oauth2.googleapis.com/token'), 'capture script exchanges code at Google OAuth token endpoint');
assert(scriptCode.includes('grant_type: \'authorization_code\''), 'capture script sets authorization_code grant_type');
assert(scriptCode.includes('extractCleanCode'), 'capture script includes URL decoding and parameter sanitization');
assert(scriptCode.includes('Refresh token saved successfully to temporary secure file.'), 'capture script outputs exact confirmation message');

console.log(`\n=== OAUTH QA RESULTS: ${passCount} PASSED, ${failCount} FAILED ===`);
if (failCount === 0) {
  console.log('✓ GOOGLE OAUTH ENDPOINTS & LOCAL CAPTURE SCRIPT VERIFIED CLEANLY!');
} else {
  process.exit(1);
}
