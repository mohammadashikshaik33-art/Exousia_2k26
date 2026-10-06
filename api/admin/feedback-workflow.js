// Vercel Serverless API Function — EXOUSIA Admin Feedback Workflow Endpoint
// Route: GET /api/admin/feedback-workflow, POST /api/admin/feedback-workflow
// Security: Requires valid ADMIN_SECRET_KEY in Authorization header or secret query parameter.

import { sendGmailEmail } from '../../lib/gmail.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version, Authorization, X-Admin-Secret'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const adminSecret = process.env.ADMIN_SECRET_KEY;
    const cronSecret = process.env.CRON_SECRET;
    const rawAuth = req.headers.authorization || req.headers['x-admin-secret'] || req.query.secret || '';
    const providedToken = String(rawAuth).replace(/^Bearer\s+/i, '').trim();

    const isAuthorized = Boolean(providedToken) && (
      (adminSecret && providedToken === adminSecret) ||
      (cronSecret && providedToken === cronSecret)
    );

    if (process.env.NODE_ENV === 'production' && !isAuthorized) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Access denied. Valid admin secret key required.'
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(503).json({
        success: false,
        code: 'DATABASE_UNCONFIGURED',
        message: 'Database service is unconfigured.'
      });
    }

    // Helper: Fetch all confirmed registrations
    async function getConfirmedRegistrations() {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/registrations?select=id,confirmation_code,primary_name,primary_email,team_name,status&status=eq.confirmed`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }
      );
      if (!response.ok) return [];
      const rows = await response.json();
      return Array.isArray(rows) ? rows.filter(r => r.team_name !== 'EMAIL_VERIFICATION' && r.primary_email) : [];
    }

    // Helper: Filter by Day
    function filterRegistrationsForDay(registrations, dayKey) {
      return registrations.filter(rec => {
        const track = (rec.team_name || '').toUpperCase();
        if (dayKey === 'day1') {
          return track.includes("CLUE'D UP") || track.includes('HAWKINS TRAP') || track.includes('DAY 1') || true; // All confirmed eligible for Day 1
        } else {
          return track.includes('DARK PROTOCOL') || track.includes('GENOVA') || track.includes('DAY 2') || true; // All confirmed eligible for Day 2
        }
      });
    }

    // Helper: Fetch Outbox Records for Day
    async function getOutboxForDay(dayKey) {
      const subjectPattern = `FEEDBACK_${dayKey.toUpperCase()}`;
      const response = await fetch(
        `${supabaseUrl}/rest/v1/email_outbox?subject=ilike.*${subjectPattern}*&select=id,recipient,subject,status,error_message,created_at,sent_at`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }
      );
      if (!response.ok) return [];
      const rows = await response.json();
      return Array.isArray(rows) ? rows : [];
    }

    // Helper: Get Campaign Schedule State
    async function getCampaignSchedule(dayKey) {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/email_outbox?recipient=eq.SYSTEM_CAMPAIGN&subject=eq.CAMPAIGN_SCHEDULE_${dayKey.toUpperCase()}&select=body,status,created_at&order=created_at.desc&limit=1`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }
      );
      if (response.ok) {
        const rows = await response.json();
        if (Array.isArray(rows) && rows.length > 0) {
          try {
            const data = JSON.parse(rows[0].body || '{}');
            return {
              status: data.status || 'IDLE',
              scheduled_at: data.scheduled_at || null,
              updated_at: rows[0].created_at
            };
          } catch (e) {
            // fallback
          }
        }
      }
      return { status: 'IDLE', scheduled_at: null, updated_at: null };
    }

    // Helper: Save Campaign Schedule State
    async function saveCampaignSchedule(dayKey, status, scheduledAt = null) {
      const payload = {
        recipient: 'SYSTEM_CAMPAIGN',
        subject: `CAMPAIGN_SCHEDULE_${dayKey.toUpperCase()}`,
        body: JSON.stringify({
          status,
          scheduled_at: scheduledAt,
          updated_at: new Date().toISOString()
        }),
        status: 'system',
        sent_at: new Date().toISOString()
      };

      await fetch(`${supabaseUrl}/rest/v1/email_outbox`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify(payload)
      }).catch((e) => console.warn('Failed to save campaign schedule log:', e));
    }

    // GET METHOD: Return Campaign Metrics & Status
    if (req.method === 'GET') {
      const requestedDay = (req.query.day || 'day1').toLowerCase();
      const allConfirmed = await getConfirmedRegistrations();

      const metrics = {};
      for (const dayKey of ['day1', 'day2']) {
        const eligibleList = filterRegistrationsForDay(allConfirmed, dayKey);
        const outboxList = await getOutboxForDay(dayKey);

        const sentSet = new Set();
        const failedSet = new Set();

        outboxList.forEach(item => {
          if (item.status === 'sent') {
            sentSet.add(item.recipient.toLowerCase());
          } else if (item.status === 'failed') {
            failedSet.add(item.recipient.toLowerCase());
          }
        });

        const sentCount = sentSet.size;
        const failedCount = Array.from(failedSet).filter(email => !sentSet.has(email)).length;
        const eligibleCount = eligibleList.length;
        const pendingCount = Math.max(0, eligibleCount - sentCount);

        const scheduleState = await getCampaignSchedule(dayKey);

        metrics[dayKey] = {
          eligible: eligibleCount,
          sent: sentCount,
          failed: failedCount,
          pending: pendingCount,
          status: scheduleState.status,
          scheduled_at: scheduleState.scheduled_at,
          updated_at: scheduleState.updated_at
        };
      }

      return res.status(200).json({
        success: true,
        metrics,
        selectedDay: requestedDay
      });
    }

    // POST METHOD: Actions (send-now, schedule, cancel-schedule, retry-failed)
    if (req.method === 'POST') {
      const { action, day, scheduled_at, force } = req.body || {};
      const dayKey = (day || 'day1').toLowerCase();

      if (!['day1', 'day2'].includes(dayKey)) {
        return res.status(422).json({ success: false, message: 'Invalid day parameter. Must be day1 or day2.' });
      }

      // ACTION 1: SEND NOW
      if (action === 'send-now') {
        // 1. Cancel any active schedule first
        await saveCampaignSchedule(dayKey, 'RUNNING', null);

        const allConfirmed = await getConfirmedRegistrations();
        const dayRegistrations = filterRegistrationsForDay(allConfirmed, dayKey);
        const outboxList = await getOutboxForDay(dayKey);

        const alreadySentEmails = new Set(
          outboxList.filter(o => o.status === 'sent').map(o => o.recipient.toLowerCase())
        );

        let sent = 0;
        let failed = 0;
        let skipped = 0;

        for (const rec of dayRegistrations) {
          if (globalThis.__EXOUSIA_LAST_OTP_TIME && (Date.now() - globalThis.__EXOUSIA_LAST_OTP_TIME < 5000)) {
            console.log('[Feedback Outbox Yield] Active OTP send detected. Yielding 3000ms for OTP priority...');
            await new Promise(r => setTimeout(r, 3000));
          }

          const email = (rec.primary_email || '').trim();
          const regCode = rec.confirmation_code || rec.id;
          if (!email) continue;

          if (alreadySentEmails.has(email.toLowerCase()) && !force) {
            skipped++;
            continue;
          }

          const feedbackLink = `https://exousia-vert.vercel.app/feedback?id=${encodeURIComponent(regCode)}&day=${dayKey}`;
          const emailSubject = dayKey === 'day1'
            ? `EXOUSIA 2K26 — We'd Love Your Feedback ❤️`
            : `EXOUSIA 2K26 — Thank You for Being With Us ❤️`;
          const outboxSubject = `FEEDBACK_${dayKey.toUpperCase()} — ${emailSubject}`;

          const closingMessageHtml = dayKey === 'day1'
            ? `Hope you enjoyed Day 1 of EXOUSIA 2K26 and reached home safely. Thank you for being part of the experience. We'll see you tomorrow for Day 2. Your presence is precious. ❤️`
            : `Hope you enjoyed Day 2 of EXOUSIA 2K26 and reached home safely. Thank you for making EXOUSIA 2K26 special with your presence. Your presence is precious. We hope to see you again at the next EXOUSIA. ❤️`;

          const emailBodyText = dayKey === 'day1'
            ? `Thank you for being part of Day 1 of EXOUSIA 2K26!\n\nWe hope you enjoyed today's events, had a great time with us, and reached home safely.\n\nYour experience matters to us. It will take only a few minutes to share your feedback and help us make tomorrow and our future events even better.\n\nShare Your Feedback: ${feedbackLink}\n\n${closingMessageHtml}\n\n— Team EXOUSIA 2K26`
            : `Thank you for being part of Day 2 of EXOUSIA 2K26!\n\nWe hope you enjoyed the experience, learned something new, met new people, and made some good memories with us.\n\nYour feedback genuinely matters. It will help us understand what worked, what didn't, and what we can do better for future events.\n\nShare Your Feedback: ${feedbackLink}\n\n${closingMessageHtml}\n\n— Team EXOUSIA 2K26`;

          const emailHtmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background-color:#0e0e0e; color:#e5e2e1; font-family:'Courier New',monospace; padding:24px;">
  <div style="max-width:540px; margin:0 auto; background-color:#140e0f; border:1px solid #e50914; border-radius:12px; padding:28px;">
    <h2 style="color:#e50914; font-size:22px; margin-top:0; letter-spacing:0.1em; text-transform:uppercase;">EXOUSIA 2K26</h2>
    <p style="font-size:14px; color:#e3beb8; line-height:1.6;">Thank you for being part of <strong>${dayKey === 'day1' ? 'Day 1' : 'Day 2'} of EXOUSIA 2K26</strong>!</p>
    
    <p style="font-size:13px; color:#e3beb8; line-height:1.6;">
      ${dayKey === 'day1' 
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
              body: `Admin Dispatched ${dayKey.toUpperCase()} Feedback`,
              status: emailSent ? 'sent' : 'failed',
              error_message: emailErrMsg,
              sent_at: emailSent ? new Date().toISOString() : null
            })
          }).catch((e) => console.warn('Outbox admin log error:', e));

          if (emailSent) {
            sent++;
            alreadySentEmails.add(email.toLowerCase());
          } else {
            failed++;
          }
        }

        await saveCampaignSchedule(dayKey, 'COMPLETED', null);

        return res.status(200).json({
          success: true,
          message: `${dayKey.toUpperCase()} Feedback dispatch complete. Sent: ${sent}, Failed: ${failed}, Skipped: ${skipped}`,
          day: dayKey,
          eligible: dayRegistrations.length,
          sent,
          failed,
          skipped
        });
      }

      // ACTION 2: SCHEDULE
      if (action === 'schedule') {
        if (!scheduled_at) {
          return res.status(422).json({ success: false, message: 'Please specify a valid scheduled date/time.' });
        }

        const dateObj = new Date(scheduled_at);
        if (isNaN(dateObj.getTime())) {
          return res.status(422).json({ success: false, message: 'Invalid scheduled date/time format.' });
        }

        await saveCampaignSchedule(dayKey, 'SCHEDULED', dateObj.toISOString());

        return res.status(200).json({
          success: true,
          message: `${dayKey.toUpperCase()} Feedback delivery successfully scheduled.`,
          day: dayKey,
          scheduled_at: dateObj.toISOString()
        });
      }

      // ACTION 3: CANCEL SCHEDULE
      if (action === 'cancel-schedule') {
        await saveCampaignSchedule(dayKey, 'CANCELLED', null);

        return res.status(200).json({
          success: true,
          message: `Scheduled ${dayKey.toUpperCase()} Feedback campaign cancelled.`,
          day: dayKey
        });
      }

      // ACTION 4: RETRY FAILED
      if (action === 'retry-failed') {
        const outboxList = await getOutboxForDay(dayKey);
        const failedRecords = outboxList.filter(o => o.status === 'failed');

        if (failedRecords.length === 0) {
          return res.status(200).json({
            success: true,
            message: `No failed deliveries found for ${dayKey.toUpperCase()}.`,
            day: dayKey,
            retried: 0,
            succeeded: 0
          });
        }

        let retriedSucceeded = 0;
        let retriedFailed = 0;

        for (const item of failedRecords) {
          const email = item.recipient;
          const regCode = item.id;
          const feedbackLink = `https://exousia-vert.vercel.app/feedback?id=${encodeURIComponent(regCode)}&day=${dayKey}`;
          const emailSubject = dayKey === 'day1'
            ? `EXOUSIA 2K26 — We'd Love Your Feedback ❤️`
            : `EXOUSIA 2K26 — Thank You for Being With Us ❤️`;

          const closingMessageHtml = dayKey === 'day1'
            ? `Hope you enjoyed Day 1 of EXOUSIA 2K26 and reached home safely. Thank you for being part of the experience. We'll see you tomorrow for Day 2. Your presence is precious. ❤️`
            : `Hope you enjoyed Day 2 of EXOUSIA 2K26 and reached home safely. Thank you for making EXOUSIA 2K26 special with your presence. Your presence is precious. We hope to see you again at the next EXOUSIA. ❤️`;

          const emailBodyText = `Retry: Share Your Feedback for ${dayKey.toUpperCase()}: ${feedbackLink}\n\n${closingMessageHtml}\n\n— Team EXOUSIA 2K26`;

          const emailHtmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background-color:#0e0e0e; color:#e5e2e1; font-family:'Courier New',monospace; padding:24px;">
  <div style="max-width:540px; margin:0 auto; background-color:#140e0f; border:1px solid #e50914; border-radius:12px; padding:28px;">
    <h2 style="color:#e50914; font-size:22px; margin-top:0; letter-spacing:0.1em; text-transform:uppercase;">EXOUSIA 2K26</h2>
    <p style="font-size:14px; color:#e3beb8; line-height:1.6;">Thank you for being part of <strong>${dayKey === 'day1' ? 'Day 1' : 'Day 2'} of EXOUSIA 2K26</strong>!</p>
    
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

          if (gmailResult.success) {
            retriedSucceeded++;
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
          } else {
            retriedFailed++;
            await fetch(`${supabaseUrl}/rest/v1/email_outbox?id=eq.${item.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
              },
              body: JSON.stringify({
                error_message: gmailResult.errorMessage
              })
            });
          }
        }

        return res.status(200).json({
          success: true,
          message: `Retry completed. Succeeded: ${retriedSucceeded}, Still Failed: ${retriedFailed}`,
          day: dayKey,
          retriedTotal: failedRecords.length,
          retriedSucceeded,
          retriedFailed
        });
      }

      return res.status(400).json({ success: false, message: 'Unknown action specified.' });
    }

    return res.status(405).json({ success: false, message: 'Method Not Allowed.' });

  } catch (err) {
    console.error('Admin Feedback Workflow API Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
  }
}
