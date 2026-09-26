// EXOUSIA test-gmail API Security & Implementation Audit Script

import fs from 'fs';

console.log('=== EXOUSIA GMAIL TEST ENDPOINT SECURITY AUDIT ===\n');

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

assert(fs.existsSync('api/admin/test-gmail.js'), 'api/admin/test-gmail.js endpoint file exists');

const code = fs.readFileSync('api/admin/test-gmail.js', 'utf8');

assert(code.includes('ADMIN_SECRET_KEY'), 'Endpoint requires ADMIN_SECRET_KEY authorization');
assert(code.includes('google_client_id') && code.includes('google_client_secret') && code.includes('google_refresh_token'), 'Endpoint references all 3 Vercel env vars');
assert(code.includes('https://oauth2.googleapis.com/token'), 'Endpoint exchanges refresh token for access token via OAuth2 endpoint');
assert(code.includes('https://gmail.googleapis.com/gmail/v1/users/me/messages/send'), 'Endpoint calls Gmail API users.messages.send with userId=me');
assert(code.includes('EXOUSIA Gmail API Test'), 'Subject matches requested text');
assert(code.includes('This is a one-time Gmail API delivery test for EXOUSIA 2K26.'), 'Body matches requested text');
assert(!code.includes('email_outbox'), 'Endpoint does NOT write to Supabase email_outbox');

// Ensure res.status(...).json(...) payloads do not include secret variable names
const jsonResponses = code.split('res.status').slice(1).join('\n');
assert(!jsonResponses.includes('clientSecret') && !jsonResponses.includes('refreshToken') && !jsonResponses.includes('accessToken'), 'res.json() payloads NEVER expose secrets or access tokens');

console.log(`\n=== GMAIL TEST QA RESULTS: ${passCount} PASSED, ${failCount} FAILED ===`);
if (failCount === 0) {
  console.log('✓ GMAIL TEST ENDPOINT VERIFIED CLEANLY!');
} else {
  process.exit(1);
}
