// EXOUSIA Email Pipeline Production Diagnostic Script

import fs from 'fs';

console.log('=== EXOUSIA EMAIL PIPELINE DIAGNOSTIC ===\n');

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || 'EXOUSIA 2026 <onboarding@resend.dev>';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

console.log(`1. ENVIRONMENT CONFIGURATION:`);
console.log(`- RESEND_API_KEY present: ${Boolean(resendApiKey)} (${resendApiKey ? resendApiKey.slice(0, 7) + '...' : 'MISSING'})`);
console.log(`- EMAIL_FROM: ${emailFrom}`);
console.log(`- SUPABASE_URL: ${supabaseUrl || 'MISSING'}`);

console.log('\n2. SENDER IDENTITY AUDIT:');
if (emailFrom.includes('onboarding@resend.dev')) {
  console.log('⚠️ SENDER USES DEFAULT RESEND ONBOARDING IDENTITY: onboarding@resend.dev');
  console.log('   IMPORTANT NOTE: Resend limits onboarding@resend.dev to sending ONLY to the verified account owner email.');
  console.log('   Emails sent to external participant domain addresses will be rejected/suppressed by Resend until a custom domain is verified.');
} else {
  console.log(`✓ Custom Sender Identity configured: ${emailFrom}`);
}

console.log('\n3. REGISTRATION -> OUTBOX -> RESEND CODE PIPELINE AUDIT:');
const regCode = fs.readFileSync('api/register.js', 'utf8');

const hasDbInsert = regCode.includes("from('registrations')") || regCode.includes('/rest/v1/registrations');
const hasOutboxInsert = regCode.includes('email_outbox');
const hasResendCall = regCode.includes('https://api.resend.com/emails');
const hasAttachment = regCode.includes('passAttachmentBase64');

console.log(`- DB Registration Insert: ${hasDbInsert ? 'YES' : 'NO'}`);
console.log(`- email_outbox Recording: ${hasOutboxInsert ? 'YES' : 'NO'}`);
console.log(`- Resend API Fetch Call: ${hasResendCall ? 'YES' : 'NO'}`);
console.log(`- Digital Pass SVG Attachment: ${hasAttachment ? 'YES' : 'NO'}`);
console.log(`- Isolation (Non-blocking): ${regCode.includes('catch (emailOutboxError)') ? 'YES (Registration succeeds even if email fails)' : 'NO'}`);
