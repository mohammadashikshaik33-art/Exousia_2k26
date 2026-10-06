import fs from 'fs';
import { sendGmailEmail } from './lib/gmail.js';

let envText = '';
if (fs.existsSync('.env.local')) envText = fs.readFileSync('.env.local', 'utf8');
else if (fs.existsSync('.env')) envText = fs.readFileSync('.env', 'utf8');

envText.split('\n').forEach(line => {
  const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
});

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function retryFailedEmails() {
  console.log('===========================================================');
  console.log('EXOUSIA 2K26 — RETRYING 4 FAILED PRODUCTION EMAILS');
  console.log('===========================================================');

  // 1. Fetch 4 failed outbox records
  const res = await fetch(`${supabaseUrl}/rest/v1/email_outbox?status=eq.failed&select=*`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  const failedItems = await res.json();
  console.log(`Found ${failedItems.length} failed outbox items.`);

  let succeeded = 0;
  let failed = 0;

  for (const item of failedItems) {
    console.log(`\nProcessing retry for Outbox ID: ${item.id} | Recipient: ${item.recipient} | Code: ${item.subject}`);

    // Idempotency check: verify if an email to this recipient with this subject was ALREADY delivered
    const dupCheck = await fetch(`${supabaseUrl}/rest/v1/email_outbox?recipient=eq.${encodeURIComponent(item.recipient)}&subject=eq.${encodeURIComponent(item.subject)}&status=eq.sent&select=id`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    if (dupCheck.ok) {
      const sentRows = await dupCheck.json();
      if (Array.isArray(sentRows) && sentRows.length > 0) {
        console.log(`✓ Email already delivered in prior execution. Updating outbox status to sent.`);
        await fetch(`${supabaseUrl}/rest/v1/email_outbox?id=eq.${item.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            status: 'sent',
            error_message: null,
            sent_at: new Date().toISOString()
          })
        });
        succeeded++;
        continue;
      }
    }

    // Extract confirmation details from stored body or subject
    const passUrlMatch = (item.body || '').match(/https:\/\/exousia-vert\.vercel\.app\/pass\?id=([A-Z0-9\-]+)/);
    const regCode = passUrlMatch ? passUrlMatch[1] : (item.subject.match(/EX-2026-[A-Z0-9]+/) || ['EX-2026'])[0];
    
    // Construct HTML email preserving exact body text
    const formattedBodyText = (item.body || '').replace(/\n/g, '<br/>');
    const emailHtmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background-color:#0e0e0e; color:#e5e2e1; font-family:'Courier New',monospace; padding:24px;">
  <div style="max-width:540px; margin:0 auto; background-color:#140e0f; border:1px solid #e50914; border-radius:12px; padding:28px;">
    <h2 style="color:#e50914; font-size:22px; margin-top:0; letter-spacing:0.1em; text-transform:uppercase;">EXOUSIA 2K26</h2>
    <p style="font-size:14px; color:#e3beb8; font-weight:bold;">REGISTRATION CONFIRMATION</p>
    
    <div style="background-color:#1c1415; border:1px solid #e50914; border-radius:8px; padding:16px; margin:20px 0; font-size:13px; line-height:1.6; color:#ffffff;">
      ${formattedBodyText}
    </div>

    <div style="text-align:center; margin:24px 0;">
      <a href="https://exousia-vert.vercel.app/pass?id=${encodeURIComponent(regCode)}" style="background-color:#e50914; color:#ffffff; font-weight:bold; font-size:13px; padding:12px 24px; text-decoration:none; border-radius:8px; display:inline-block; letter-spacing:0.1em;">
        VIEW ANOMALY FILE ⚡
      </a>
    </div>

    <p style="font-size:12px; color:#aa8984; margin-bottom:0; border-top:1px solid #332225; padding-top:12px;">— Team EXOUSIA 2K26 // Department of EEE</p>
  </div>
</body>
</html>`;

    // Stagger retry requests by 1 second to avoid rate limits
    await new Promise(r => setTimeout(r, 1000));

    const gmailResult = await sendGmailEmail({
      to: item.recipient,
      subject: item.subject,
      html: emailHtmlBody,
      text: item.body
    });

    if (gmailResult.success) {
      console.log(`✓ Gmail API accepted email for ${item.recipient} (Message ID: ${gmailResult.messageId})`);
      await fetch(`${supabaseUrl}/rest/v1/email_outbox?id=eq.${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          status: 'sent',
          error_message: null,
          sent_at: new Date().toISOString()
        })
      });
      succeeded++;
    } else {
      console.error(`❌ Retry failed for ${item.recipient}: ${gmailResult.errorMessage}`);
      await fetch(`${supabaseUrl}/rest/v1/email_outbox?id=eq.${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          error_message: `Retry failed: ${gmailResult.errorMessage}`
        })
      });
      failed++;
    }
  }

  // 2. Verify final outbox status summary
  const finalOutboxRes = await fetch(`${supabaseUrl}/rest/v1/email_outbox?select=status`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  const allOutbox = await finalOutboxRes.json();
  const summary = allOutbox.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});

  console.log('\n===========================================================');
  console.log(`RETRY SUMMARY: Succeeded=${succeeded}, Remaining Failed=${failed}`);
  console.log('FINAL EMAIL OUTBOX STATUS SUMMARY:', summary);
  console.log('===========================================================');
}

retryFailedEmails();
