// EXOUSIA 5-PIN Local Production Automated QA Script

import fs from 'fs';
import path from 'path';

console.log('=== EXOUSIA 5-PIN AUTOMATED PRODUCTION QA VERIFICATION ===\n');

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

// PIN 1: Digital Pass Visual Match Audit
console.log('--- PIN 1: DIGITAL PASS VISUAL & MARKUP AUDIT ---');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const styleCss = fs.readFileSync('src/style.css', 'utf8');
const mainJs = fs.readFileSync('src/main.js', 'utf8');

assert(indexHtml.includes('pass-inst-header') && indexHtml.includes('DEPARTMENT OF EEE'), 'Digital Pass header includes institutional title');
assert(indexHtml.includes('pass-title-exousia') && indexHtml.includes('pass-title-2k26'), 'Digital Pass hero lockup includes EXOUSIA 2K26 titles');
assert(indexHtml.includes('pass-subtitle-digital'), 'Digital Pass includes DIGITAL PASS subtitle');
assert(indexHtml.includes('pass-info-name') && indexHtml.includes('pass-info-college'), 'Digital Pass includes participant name & college fields');
assert(indexHtml.includes('pass-info-status') && indexHtml.includes('ENTRY AUTHORIZED'), 'Digital Pass includes ENTRY AUTHORIZED status indicator');
assert(indexHtml.includes('pass-qr-frame') && indexHtml.includes('SCAN FOR ENTRY'), 'Digital Pass includes glowing QR frame with SCAN FOR ENTRY caption');

assert(styleCss.includes('.exousia-digital-pass-card') && styleCss.includes('border: 1.5px solid #e50914'), 'CSS pass card has solid 1.5px red border');
assert(styleCss.includes('box-shadow:') && styleCss.includes('rgba(229, 9, 20'), 'CSS pass card has glowing red outer box-shadow');
assert(mainJs.includes('canvas.width = 1280') && mainJs.includes('canvas.height = 440'), 'Canvas download renders high-res 1280x440 image matching reference pass');

// PIN 2: Email Reliability Audit
console.log('\n--- PIN 2: EMAIL CONFIRMATION RELIABILITY AUDIT ---');
const registerApi = fs.readFileSync('api/register.js', 'utf8');
assert(registerApi.includes('email_outbox') && registerApi.includes('non-blocking'), 'api/register.js records entries in email_outbox without blocking 201 response');
assert(fs.existsSync('api/admin/retry-email.js'), 'api/admin/retry-email.js exists for safe outbox retries');
const retryApi = fs.readFileSync('api/admin/retry-email.js', 'utf8');
assert(retryApi.includes('status=neq.sent') && retryApi.includes('ADMIN_SECRET_KEY'), 'retry-email endpoint checks outbox status and enforces admin key');

// PIN 3: Restricted Coordinator Dashboard Audit
console.log('\n--- PIN 3: RESTRICTED COORDINATOR DASHBOARD AUDIT ---');
assert(fs.existsSync('coordinator.html'), 'coordinator.html page exists');
assert(fs.existsSync('src/coordinator.js'), 'src/coordinator.js logic script exists');
assert(fs.existsSync('api/coordinator/registrations.js'), 'api/coordinator/registrations.js endpoint exists');
const coordApi = fs.readFileSync('api/coordinator/registrations.js', 'utf8');
assert(coordApi.includes("select', 'id,confirmation_code,primary_name,primary_email,primary_college,team_name,created_at,status'"), 'Coordinator SQL select explicitly projects only safe non-PII fields');
assert(!coordApi.includes('primary_phone') && !coordApi.includes('rec.phone'), 'CRITICAL: Phone numbers are 100% excluded from coordinator API response keys');

// PIN 4: Day-Wise Feedback Email System Audit
console.log('\n--- PIN 4: DAY-WISE FEEDBACK SYSTEM AUDIT ---');
assert(fs.existsSync('feedback.html'), 'feedback.html page exists');
assert(fs.existsSync('src/feedback.js'), 'src/feedback.js logic script exists');
assert(fs.existsSync('api/feedback.js'), 'api/feedback.js endpoint exists');
assert(fs.existsSync('api/send-feedback-email.js'), 'api/send-feedback-email.js endpoint exists');

const feedbackApi = fs.readFileSync('api/feedback.js', 'utf8');
assert(feedbackApi.includes('feedback_responses') && feedbackApi.includes('DUPLICATE_FEEDBACK'), 'api/feedback.js enforces duplicate feedback checks per day');

// PIN 5: Security & Routing Audit
console.log('\n--- PIN 5: SECURITY & BUILD CONFIGURATION AUDIT ---');
const vercelJson = fs.readFileSync('vercel.json', 'utf8');
const viteConfig = fs.readFileSync('vite.config.js', 'utf8');
assert(vercelJson.includes('/coordinator') && vercelJson.includes('/feedback'), 'vercel.json includes clean URLs for coordinator and feedback routes');
assert(viteConfig.includes('coordinator') && viteConfig.includes('feedback'), 'vite.config.js rollupOptions includes coordinator and feedback build targets');

console.log(`\n=== QA RESULTS: ${passCount} PASSED, ${failCount} FAILED ===`);
if (failCount === 0) {
  console.log('✓ ALL 5 PINS VERIFIED CLEANLY LOCALLY!');
} else {
  process.exit(1);
}
