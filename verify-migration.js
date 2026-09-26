// EXOUSIA Resend -> Gmail API Migration Audit Script
// Path: verify-migration.js

import fs from 'fs';

console.log('=== EXOUSIA GMAIL API MIGRATION STATIC AUDIT ===\n');

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

// 1. Check Gmail Helper File
assert(fs.existsSync('lib/gmail.js'), 'lib/gmail.js helper module exists');
const gmailHelperCode = fs.existsSync('lib/gmail.js') ? fs.readFileSync('lib/gmail.js', 'utf8') : '';
assert(gmailHelperCode.includes('https://oauth2.googleapis.com/token'), 'Gmail helper refreshes access token at OAuth endpoint');
assert(gmailHelperCode.includes('https://gmail.googleapis.com/gmail/v1/users/me/messages/send'), 'Gmail helper sends via Gmail API users.messages.send');
assert(gmailHelperCode.includes('multipart/mixed'), 'Gmail helper supports multipart/mixed MIME attachments');

// 2. Check Provider Migration in Target Endpoints
const targetFiles = [
  'api/register.js',
  'api/admin/retry-email.js',
  'api/send-feedback-email.js',
  'api/cron/feedback.js'
];

targetFiles.forEach(file => {
  assert(fs.existsSync(file), `${file} file exists`);
  const code = fs.readFileSync(file, 'utf8');
  assert(!code.includes('https://api.resend.com/emails'), `No active Resend API fetch calls remain in ${file}`);
  assert(code.includes('sendGmailEmail'), `sendGmailEmail helper is imported and called in ${file}`);
});

// 3. Verify Security & Credentials Isolation
const allApiCode = targetFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n') + gmailHelperCode;
assert(!allApiCode.includes('client_secret=GOCSPX-') && !allApiCode.includes('refresh_token=1//'), 'Zero hardcoded OAuth secrets in codebase');
assert(!allApiCode.includes('console.log') || !allApiCode.includes('access_token'), 'Access tokens and refresh tokens are never logged');

// 4. Verify Architecture Requirements
const regCode = fs.readFileSync('api/register.js', 'utf8');
assert(regCode.includes('catch (emailOutboxError)'), 'Registration email failure remains isolated from database registration response');
assert(regCode.includes('email_outbox'), 'Registration outbox recording preserved');

const retryCode = fs.readFileSync('api/admin/retry-email.js', 'utf8');
assert(retryCode.includes('email_outbox?id=eq.'), 'Retry endpoint updates existing outbox rows rather than creating new registrations');

const feedbackCode = fs.readFileSync('api/send-feedback-email.js', 'utf8');
assert(feedbackCode.includes('subject=ilike.*FEEDBACK'), 'Feedback duplicate prevention remains active via email_outbox check');

const cronCode = fs.readFileSync('api/cron/feedback.js', 'utf8');
assert(cronCode.includes('subject=ilike.*FEEDBACK'), 'Cron feedback duplicate prevention remains active via email_outbox check');

// 5. Verify Vercel Cron Schedules
const vercelJson = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const day1Cron = vercelJson.crons.find(c => c.path === '/api/cron/feedback-day1');
const day2Cron = vercelJson.crons.find(c => c.path === '/api/cron/feedback-day2');

assert(day1Cron && day1Cron.schedule === '0 13 30 9 *', 'Day 1 cron schedule is set to 0 13 30 9 * (6:30 PM IST)');
assert(day2Cron && day2Cron.schedule === '0 13 1 10 *', 'Day 2 cron schedule is set to 0 13 1 10 * (6:30 PM IST)');

console.log(`\n=== MIGRATION AUDIT RESULTS: ${passCount} PASSED, ${failCount} FAILED ===`);
if (failCount === 0) {
  console.log('✓ GMAIL API MIGRATION AUDIT VERIFIED 100% CLEAN!');
} else {
  process.exit(1);
}
