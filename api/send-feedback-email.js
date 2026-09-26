// Vercel Serverless API Function — EXOUSIA Scheduled Feedback Email Dispatcher
// Route: POST /api/send-feedback-email
// Security: Requires ADMIN_SECRET_KEY token.
// Purpose: Trigger day-wise feedback request emails with direct token links.

import { sendGmailEmail } from '../lib/gmail.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version, Authorization, X-Admin-Secret'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method Not Allowed. Use POST.'
    });
  }

  try {
    const adminSecret = process.env.ADMIN_SECRET_KEY;
    if (!adminSecret) {
      return res.status(503).json({
        success: false,
        code: 'ADMIN_UNCONFIGURED',
        message: 'Admin authorization key is unconfigured on server.'
      });
    }

    const rawAuth = req.headers.authorization || req.headers['x-admin-secret'] || req.body?.adminSecret || '';
    const providedToken = String(rawAuth).replace(/^Bearer\s+/i, '').trim();

    if (!providedToken || providedToken !== adminSecret) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Access denied. Valid admin authorization required.'
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(503).json({
        success: false,
        code: 'DATABASE_UNCONFIGURED',
        message: 'Database connection is unconfigured.'
      });
    }

    const { day } = req.body || {};
    const selectedDay = (day || 'day1').trim().toLowerCase();

    if (!['day1', 'day2'].includes(selectedDay)) {
      return res.status(422).json({
        success: false,
        code: 'INVALID_DAY',
        message: 'Day parameter must be day1 or day2.'
      });
    }

    const dayTitle = selectedDay === 'day1' ? 'DAY 1 (SEPTEMBER 30)' : 'DAY 2 (OCTOBER 1)';

    // Fetch participants
    const regRes = await fetch(`${supabaseUrl}/rest/v1/registrations?select=id,confirmation_code,primary_name,primary_email,team_name`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Accept': 'application/json'
      }
    });

    if (!regRes.ok) {
      const errTxt = await regRes.text();
      return res.status(500).json({
        success: false,
        code: 'DATABASE_QUERY_ERROR',
        message: `Failed to fetch registrations: ${errTxt}`
      });
    }

    const allRegistrations = await regRes.json();
    if (!Array.isArray(allRegistrations) || allRegistrations.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No participant registrations found to dispatch feedback emails.',
        sent: 0
      });
    }

    // Filter registrations relevant to the selected day
    const dayRegistrations = allRegistrations.filter(rec => {
      const track = (rec.team_name || '').toUpperCase();
      if (selectedDay === 'day1') {
        return track.includes('CLUE\'D UP') || track.includes('HAWKINS TRAP') || track.includes('DAY 1');
      } else {
        return track.includes('DARK PROTOCOL') || track.includes('GENOVA') || track.includes('DAY 2');
      }
    });

    let sentCount = 0;
    let skippedCount = 0;
    const logs = [];

    for (const rec of dayRegistrations) {
      try {
        const regCode = rec.confirmation_code || rec.id;
        const email = rec.primary_email;
        const name = rec.primary_name || 'Participant';

        if (!email) continue;

        // Idempotency Check: Verify if feedback email was already sent to this recipient for this day
        const outboxCheck = await fetch(`${supabaseUrl}/rest/v1/email_outbox?recipient=eq.${encodeURIComponent(email)}&subject=ilike.*FEEDBACK*${selectedDay.toUpperCase()}*&select=id`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });

        if (outboxCheck.ok) {
          const existingOutbox = await outboxCheck.json();
          if (Array.isArray(existingOutbox) && existingOutbox.length > 0) {
            skippedCount++;
            continue;
          }
        }

        const feedbackLink = `https://exousia-vert.vercel.app/feedback?id=${encodeURIComponent(regCode)}&day=${selectedDay}`;
        const emailSubject = selectedDay === 'day1' 
          ? `EXOUSIA 2K26 — We'd Love Your Feedback ❤️` 
          : `EXOUSIA 2K26 — Thank You for Being With Us ❤️`;

        const emailBodyText = selectedDay === 'day1'
          ? `Thank you for being part of Day 1 of EXOUSIA 2K26!\n\nWe hope you enjoyed today's events, had a great time with us, and reached home safely.\n\nYour experience matters to us. It will take only a few minutes to share your feedback and help us make tomorrow and our future events even better.\n\nShare Your Feedback: ${feedbackLink}\n\nHope you enjoyed today's events and reached your home safely. Wishing you to attend Day 2 also. Your presence is precious. ❤️\n\n— Team EXOUSIA 2K26`
          : `Thank you for being part of Day 2 of EXOUSIA 2K26!\n\nWe hope you enjoyed the experience, learned something new, met new people, and made some good memories with us.\n\nYour feedback genuinely matters. It will help us understand what worked, what didn't, and what we can do better for future events.\n\nShare Your Feedback: ${feedbackLink}\n\nThank you for being a part of EXOUSIA. Your presence made this event special. ❤️\n\n— Team EXOUSIA 2K26`;

        const emailHtmlBody = selectedDay === 'day1' ? `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background-color:#0e0e0e; color:#e5e2e1; font-family:'Courier New',monospace; padding:24px;">
  <div style="max-width:540px; margin:0 auto; background-color:#140e0f; border:1px solid #5a403c; border-radius:12px; padding:28px;">
    <h2 style="color:#ffb4a8; font-size:22px; margin-top:0; letter-spacing:0.1em; text-transform:uppercase;">EXOUSIA 2K26</h2>
    <p style="font-size:14px; color:#e3beb8; line-height:1.6;">Thank you for being part of <strong>Day 1 of EXOUSIA 2K26</strong>!</p>
    
    <p style="font-size:13px; color:#e3beb8; line-height:1.6;">
      We hope you enjoyed today's events, had a great time with us, and reached home safely.
    </p>
    <p style="font-size:13px; color:#e3beb8; line-height:1.6;">
      Your experience matters to us. It will take only a few minutes to share your feedback and help us make tomorrow and our future events even better.
    </p>

    <div style="text-align:center; margin:28px 0;">
      <a href="${feedbackLink}" style="background-color:#e50914; color:#ffffff; font-weight:bold; font-size:14px; padding:14px 28px; text-decoration:none; border-radius:8px; display:inline-block; letter-spacing:0.1em;">
        SHARE YOUR FEEDBACK ❤️
      </a>
    </div>

    <p style="font-size:13px; color:#ffb4a8; line-height:1.6; font-style:italic;">
      Hope you enjoyed today's events and reached your home safely. Wishing you to attend Day 2 also. Your presence is precious. ❤️
    </p>
    <p style="font-size:12px; color:#aa8984; margin-bottom:0;">— Team EXOUSIA 2K26 // Department of EEE</p>
  </div>
</body>
</html>` : `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background-color:#0e0e0e; color:#e5e2e1; font-family:'Courier New',monospace; padding:24px;">
  <div style="max-width:540px; margin:0 auto; background-color:#140e0f; border:1px solid #5a403c; border-radius:12px; padding:28px;">
    <h2 style="color:#ffb4a8; font-size:22px; margin-top:0; letter-spacing:0.1em; text-transform:uppercase;">EXOUSIA 2K26</h2>
    <p style="font-size:14px; color:#e3beb8; line-height:1.6;">Thank you for being part of <strong>Day 2 of EXOUSIA 2K26</strong>!</p>
    
    <p style="font-size:13px; color:#e3beb8; line-height:1.6;">
      We hope you enjoyed the experience, learned something new, met new people, and made some good memories with us.
    </p>
    <p style="font-size:13px; color:#e3beb8; line-height:1.6;">
      Your feedback genuinely matters. It will help us understand what worked, what didn't, and what we can do better for future events.
    </p>

    <div style="text-align:center; margin:28px 0;">
      <a href="${feedbackLink}" style="background-color:#e50914; color:#ffffff; font-weight:bold; font-size:14px; padding:14px 28px; text-decoration:none; border-radius:8px; display:inline-block; letter-spacing:0.1em;">
        SHARE YOUR FEEDBACK ❤️
      </a>
    </div>

    <p style="font-size:13px; color:#ffb4a8; line-height:1.6; font-style:italic;">
      Thank you for being a part of EXOUSIA. Your presence made this event special. ❤️
    </p>
    <p style="font-size:12px; color:#aa8984; margin-bottom:0;">— Team EXOUSIA 2K26 // Department of EEE</p>
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

        // Record entry in email_outbox
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
            subject: `FEEDBACK_${selectedDay.toUpperCase()}_${emailSubject}`,
            body: `Feedback email for ${selectedDay}`,
            status: emailSent ? 'sent' : 'failed',
            error_message: emailErrMsg,
            sent_at: emailSent ? new Date().toISOString() : null
          })
        }).catch((e) => console.warn('Outbox insert err:', e));

        if (emailSent) sentCount++;
        logs.push({ email, status: emailSent ? 'sent' : 'failed' });

      } catch (err) {
        console.warn('Feedback send loop item error:', err);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Feedback email trigger completed for ${selectedDay.toUpperCase()}.`,
      day: selectedDay,
      totalParticipants: dayRegistrations.length,
      sentCount,
      skippedCount
    });

  } catch (error) {
    console.error('Send Feedback Email Error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Server error triggering feedback emails.'
    });
  }
}
