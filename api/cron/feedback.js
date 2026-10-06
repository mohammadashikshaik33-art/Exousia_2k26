// Vercel Serverless Cron Handler — Day 1 & Day 2 Feedback Automatic Dispatcher
// Routes: GET /api/cron/feedback-day1 & GET /api/cron/feedback-day2

import { sendGmailEmail } from '../../lib/gmail.js';

export default async function handler(req, res) {
  const url = req.url || '';
  const dayParam = req.query?.day || (url.includes('day2') ? 'day2' : 'day1');

  const authHeader = req.headers.authorization || '';
  const cronHeader = req.headers['x-vercel-cron'] || '';
  const adminSecret = process.env.ADMIN_SECRET_KEY;
  const cronSecret = process.env.CRON_SECRET;

  const isVercelCron = cronHeader === '1' || Boolean(cronHeader);
  const isAdminAuth = (adminSecret && authHeader.includes(adminSecret)) || (cronSecret && authHeader.includes(cronSecret));

  if (process.env.NODE_ENV === 'production' && !isVercelCron && !isAdminAuth) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED_CRON',
      message: 'Unauthorized cron invocation.'
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({
      success: false,
      code: 'DATABASE_UNCONFIGURED',
      message: 'Database unconfigured.'
    });
  }

  try {
    // Check if campaign has been cancelled via admin workflow
    const schedCheck = await fetch(
      `${supabaseUrl}/rest/v1/email_outbox?recipient=eq.SYSTEM_CAMPAIGN&subject=eq.CAMPAIGN_SCHEDULE_${dayParam.toUpperCase()}&select=body&order=created_at.desc&limit=1`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    if (schedCheck.ok) {
      const rows = await schedCheck.json();
      if (Array.isArray(rows) && rows[0]) {
        try {
          const data = JSON.parse(rows[0].body || '{}');
          if (data.status === 'CANCELLED') {
            return res.status(200).json({
              success: true,
              message: `${dayParam.toUpperCase()} feedback delivery was cancelled by admin schedule. Skipping cron execution.`,
              skipped: true
            });
          }
        } catch (e) {
          // continue
        }
      }
    }

    const regRes = await fetch(`${supabaseUrl}/rest/v1/registrations?select=id,confirmation_code,primary_name,primary_email,team_name,status&status=eq.confirmed`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!regRes.ok) {
      return res.status(500).json({ success: false, message: 'Failed to fetch registrations.' });
    }

    const allRegistrations = await regRes.json();
    const dayRegistrations = allRegistrations.filter(rec => {
      if (rec.team_name === 'EMAIL_VERIFICATION') return false;
      const track = (rec.team_name || '').toUpperCase();
      if (dayParam === 'day1') {
        return track.includes("CLUE'D UP") || track.includes('HAWKINS TRAP') || track.includes('DAY 1') || true;
      } else {
        return track.includes('DARK PROTOCOL') || track.includes('GENOVA') || track.includes('DAY 2') || true;
      }
    });

    let sent = 0;
    let skipped = 0;

    const closingMessageHtml = dayParam === 'day1'
      ? `Hope you enjoyed Day 1 of EXOUSIA 2K26 and reached home safely. Thank you for being part of the experience. We'll see you tomorrow for Day 2. Your presence is precious. ❤️`
      : `Hope you enjoyed Day 2 of EXOUSIA 2K26 and reached home safely. Thank you for making EXOUSIA 2K26 special with your presence. Your presence is precious. We hope to see you again at the next EXOUSIA. ❤️`;

    for (const rec of dayRegistrations) {
      const email = rec.primary_email;
      const regCode = rec.confirmation_code || rec.id;
      if (!email) continue;

      // Idempotency Check
      const outboxCheck = await fetch(`${supabaseUrl}/rest/v1/email_outbox?recipient=eq.${encodeURIComponent(email)}&subject=ilike.*FEEDBACK_${dayParam.toUpperCase()}*&select=id,status`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (outboxCheck.ok) {
        const existing = await outboxCheck.json();
        if (Array.isArray(existing) && existing.some(item => item.status === 'sent')) {
          skipped++;
          continue;
        }
      }

      const feedbackLink = `https://exousia-vert.vercel.app/feedback?id=${encodeURIComponent(regCode)}&day=${dayParam}`;
      const emailSubject = dayParam === 'day1' 
        ? `EXOUSIA 2K26 — We'd Love Your Feedback ❤️` 
        : `EXOUSIA 2K26 — Thank You for Being With Us ❤️`;
      const outboxSubject = `FEEDBACK_${dayParam.toUpperCase()} — ${emailSubject}`;

      const emailBodyText = dayParam === 'day1'
        ? `Thank you for being part of Day 1 of EXOUSIA 2K26!\n\nWe hope you enjoyed today's events, had a great time with us, and reached home safely.\n\nYour experience matters to us. It will take only a few minutes to share your feedback and help us make tomorrow and our future events even better.\n\nShare Your Feedback: ${feedbackLink}\n\n${closingMessageHtml}\n\n— Team EXOUSIA 2K26`
        : `Thank you for being part of Day 2 of EXOUSIA 2K26!\n\nWe hope you enjoyed the experience, learned something new, met new people, and made some good memories with us.\n\nYour feedback genuinely matters. It will help us understand what worked, what didn't, and what we can do better for future events.\n\nShare Your Feedback: ${feedbackLink}\n\n${closingMessageHtml}\n\n— Team EXOUSIA 2K26`;

      const emailHtmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background-color:#0e0e0e; color:#e5e2e1; font-family:'Courier New',monospace; padding:24px;">
  <div style="max-width:540px; margin:0 auto; background-color:#140e0f; border:1px solid #e50914; border-radius:12px; padding:28px;">
    <h2 style="color:#e50914; font-size:22px; margin-top:0; letter-spacing:0.1em; text-transform:uppercase;">EXOUSIA 2K26</h2>
    <p style="font-size:14px; color:#e3beb8; line-height:1.6;">Thank you for being part of <strong>${dayParam === 'day1' ? 'Day 1' : 'Day 2'} of EXOUSIA 2K26</strong>!</p>
    
    <p style="font-size:13px; color:#e3beb8; line-height:1.6;">
      ${dayParam === 'day1' 
        ? "We hope you enjoyed today's events, had a great time with us, and reached home safely."
        : "We hope you enjoyed the experience, learned something new, met new people, and made some good memories with us."}
    </p>
    <p style="font-size:13px; color:#e3beb8; line-height:1.6;">
      Your experience matters to us. It will take only a few minutes to share your feedback and help us make our future events even better.
    </p>

    <div style="text-align:center; margin:28px 0;">
      <a href="${feedbackLink}" style="background-color:#e50914; color:#ffffff; font-weight:bold; font-size:14px; padding:14px 28px; text-decoration:none; border-radius:8px; display:inline-block; letter-spacing:0.1em;">
        SHARE YOUR FEEDBACK ❤️
      </a>
    </div>

    <div style="background-color:#1c1315; border-left:4px solid #e50914; padding:14px; margin:20px 0; border-radius:4px;">
      <p style="font-size:13px; color:#ffb4a8; line-height:1.6; margin:0; font-style:italic;">
        ${closingMessageHtml}
      </p>
    </div>

    <p style="font-size:12px; color:#aa8984; margin-bottom:0; border-top:1px solid #332225; padding-top:12px;">— Team EXOUSIA 2K26 // Department of EEE</p>
  </div>
</body>
</html>`;

      const gmailResult = await sendGmailEmail({
        to: email,
        subject: emailSubject,
        html: emailHtmlBody,
        text: emailBodyText
      });

      const emailSent = gmailResult.success;
      const emailErrMsg = gmailResult.errorMessage;

      await fetch(`${supabaseUrl}/rest/v1/email_outbox`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          registration_id: rec.id,
          recipient: email,
          subject: outboxSubject,
          body: `Automated ${dayParam.toUpperCase()} Feedback Cron`,
          status: emailSent ? 'sent' : 'failed',
          error_message: emailErrMsg,
          sent_at: emailSent ? new Date().toISOString() : null
        })
      }).catch((e) => console.warn('Outbox cron log error:', e));

      if (emailSent) sent++;
    }

    return res.status(200).json({
      success: true,
      message: `${dayParam.toUpperCase()} feedback cron execution finished.`,
      eligible: dayRegistrations.length,
      sent,
      skipped
    });

  } catch (err) {
    console.error(`${dayParam} Cron Error:`, err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
