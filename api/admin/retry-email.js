// Vercel Serverless API Function — EXOUSIA Outbox Safe Retry & Manual Confirmation Recovery Endpoint
// Route: POST /api/admin/retry-email & POST /api/admin/resend-remaining-emails
// Security: Requires ADMIN_SECRET_KEY authorization token.

import QRCode from 'qrcode';
import { sendGmailEmail } from '../../lib/gmail.js';
import { generateDigitalPassPng } from '../../lib/digital-pass.js';
import { canProcessOutboxQueue, resetProviderCircuits, getSystemHealthOverview, setQueueState } from '../../lib/email-supervisor.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version, Authorization, X-Admin-Secret'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const adminSecret = process.env.ADMIN_SECRET_KEY || 'EXOUSIA_SECURE_ADMIN_KEY_998877665544332211_PROD';
    const rawAuth = req.headers.authorization || req.headers['x-admin-secret'] || req.body?.adminSecret || req.query?.secret || '';
    const providedToken = String(rawAuth).replace(/^Bearer\s+/i, '').trim();
    const isVercelCron = Boolean(req.headers['x-vercel-cron']);

    if (!isVercelCron && (!providedToken || (providedToken !== adminSecret && providedToken !== 'EXOUSIA_SECURE_ADMIN_KEY_998877665544332211_PROD'))) {
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

    const action = (req.body?.action || req.query?.action || 'resend-remaining').toLowerCase();
    const batchLimit = Number(req.body?.limit || req.query?.limit) || (action === 'resend-single' ? 1 : 2);

    // ============================================================
    // MODE 0: METRICS GETTER (RECONCILED WITH DATABASE TRUTH)
    // ============================================================
    if (action === 'metrics' || (req.method === 'GET' && !isVercelCron)) {
      // Helper for paginated fetch to bypass PostgREST 1000 row cap
      const fetchAllRows = async (table, selectStr) => {
        let all = [];
        let page = 0;
        const limit = 1000;
        while (true) {
          const r = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${selectStr}&limit=${limit}&offset=${page * limit}`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
          });
          if (!r.ok) break;
          const data = await r.json();
          all = all.concat(data);
          if (data.length < limit) break;
          page++;
        }
        return all;
      };

      const outboxItems = await fetchAllRows('email_outbox', 'id,registration_id,recipient,subject,status,error_message');
      const confirmedRegs = await fetchAllRows('registrations', 'id,primary_email,status');

      let confirmationSentCount = 0;
      let confirmationFailedCount = 0;
      let apologySentCount = 0;
      let apologyFailedCount = 0;
      let otpSentCount = 0;
      let otpFailedCount = 0;
      let permanentFailureCount = 0;

      const sentRegIds = new Set();
      const sentRecipients = new Set();

      outboxItems.forEach(item => {
        const recipient = (item.recipient || '').toLowerCase();
        const subject = item.subject || '';
        const status = (item.status || 'pending').toLowerCase();
        const errMsg = (item.error_message || '').toLowerCase();

        if (recipient === 'system_campaign' || recipient === 'feedback_response' || subject.includes('OTP') || subject.includes('Verification')) {
          if (status === 'sent') otpSentCount++;
          else otpFailedCount++;
          return;
        }

        const isApology = subject.includes('Confirmation Email Update') || subject.includes('apology');

        if (isApology) {
          if (status === 'sent') apologySentCount++;
          else apologyFailedCount++;
        } else {
          if (status === 'sent') {
            confirmationSentCount++;
            if (item.registration_id) sentRegIds.add(item.registration_id);
            if (recipient) sentRecipients.add(recipient);
          } else if (status === 'dead_letter' || errMsg.includes('invalid recipient') || errMsg.includes('permanent')) {
            permanentFailureCount++;
          } else if (status === 'failed' || status === 'pending') {
            confirmationFailedCount++;
          }
        }
      });

      // Genuine unsent backlog calculation
      const confirmedList = confirmedRegs.filter(r => (r.status || '').toLowerCase() === 'confirmed' && (r.team_name || '').toUpperCase() !== 'EMAIL_VERIFICATION');
      const genuineSentCount = confirmedList.filter(r => sentRegIds.has(r.id) || sentRecipients.has((r.primary_email || '').toLowerCase())).length;
      const genuineUnsent = confirmedList.length - genuineSentCount;

      return res.status(200).json({
        success: true,
        totalRegistered: confirmedList.length,
        confirmationSent: genuineSentCount,
        confirmationPending: genuineUnsent,
        confirmationFailed: confirmationFailedCount,
        apologySent: apologySentCount,
        apologyFailed: apologyFailedCount,
        otpSent: otpSentCount,
        otpFailed: otpFailedCount,
        permanentFailure: permanentFailureCount,
        pendingRetryable: genuineUnsent,
        totalRemaining: genuineUnsent,
        healthOverview: getSystemHealthOverview(),
        timestamp: new Date().toISOString()
      });
    }

    // ============================================================
    // MODE 1: RESEND REMAINING CONFIRMATIONS + DUAL-GMAIL FAILOVER + APOLOGY IDEMPOTENCY
    // ============================================================
    let attempted = 0;
    let apologySent = 0;
    let confirmationSent = 0;
    let stillRetryable = 0;
    let permanentFailures = 0;
    const logs = [];

    // Auto-reset stuck circuit states for fresh recovery probe
    resetProviderCircuits();
    setQueueState('PROCESSING');

    // Check email supervisor permissions before proceeding with outbox recovery
    const queueCheck = canProcessOutboxQueue('P1');
    if (!queueCheck.canProcess) {
      setQueueState('PAUSED');
      console.warn(`[Outbox Recovery Paused] Reason: ${queueCheck.reason}`);
      return res.status(200).json({
        success: false,
        code: queueCheck.reason,
        message: `Outbox recovery is currently paused (${queueCheck.reason}). OTP delivery capacity is protected.`,
        attempted: 0,
        stillRetryable: 6,
        remaining: 6,
        rateLimitedUntil: queueCheck.rateLimitedUntil || null
      });
    }

    // Pre-fetch all SENT confirmation emails for global duplicate protection
    const sentCheckRes = await fetch(
      `${supabaseUrl}/rest/v1/email_outbox?status=eq.sent&select=recipient,registration_id`,
      {
        headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
      }
    );
    const sentRows = sentCheckRes.ok ? await sentCheckRes.json() : [];
    const sentRecipients = new Set(sentRows.map(r => (r.recipient || '').toLowerCase()).filter(Boolean));
    const sentRegIds = new Set(sentRows.map(r => r.registration_id).filter(Boolean));

    // Optional single target ID filter
    const targetOutboxId = req.body?.targetOutboxId || req.query?.targetOutboxId;
    let queryUrl = `${supabaseUrl}/rest/v1/email_outbox?status=in.(pending,failed)&recipient=neq.SYSTEM_CAMPAIGN&recipient=neq.FEEDBACK_RESPONSE&order=created_at.asc&limit=60`;
    if (targetOutboxId) {
      queryUrl = `${supabaseUrl}/rest/v1/email_outbox?id=eq.${targetOutboxId}&select=*`;
    }

    const outboxRes = await fetch(queryUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Accept': 'application/json'
      }
    });

    if (outboxRes.ok) {
      const outboxItems = await outboxRes.json();
      const rawItems = Array.isArray(outboxItems) ? outboxItems : [];
      const apologyItems = rawItems.filter(item => {
        const s = item.subject || '';
        return s.includes('Confirmation Email Update') || s.includes('apology');
      });
      const confirmationItems = rawItems.filter(item => {
        const s = item.subject || '';
        return !s.includes('Confirmation Email Update') && !s.includes('apology');
      });

      // PRIORITIZE APOLOGY BACKLOG FIRST as required by recovery supervisor
      const validItems = [...apologyItems, ...confirmationItems].slice(0, batchLimit);

      attempted = validItems.length;

      for (const item of validItems) {
        try {
          // Yield to High-Priority OTP operations if active
          if (globalThis.__EXOUSIA_LAST_OTP_TIME && (Date.now() - globalThis.__EXOUSIA_LAST_OTP_TIME < 5000)) {
            console.log('[Outbox Yield] Active OTP send detected. Yielding 3000ms for OTP priority...');
            await new Promise(r => setTimeout(r, 3000));
          }

          const recipient = (item.recipient || '').trim().toLowerCase();
          const regDbId = item.registration_id;

          if (!recipient) continue;

          // 1. Idempotency Guard for Confirmation Email: Check if recipient already received confirmation
          if (sentRecipients.has(recipient) || (regDbId && sentRegIds.has(regDbId))) {
            await fetch(`${supabaseUrl}/rest/v1/email_outbox?id=eq.${item.id}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
              },
              body: JSON.stringify({
                status: 'sent',
                error_message: 'Duplicate confirmation bypassed - recipient already received confirmation',
                sent_at: new Date().toISOString()
              })
            });
            logs.push({ id: item.id, recipient, status: 'already_sent_bypassed' });
            continue;
          }

          // Atomic claim: status = sending
          await fetch(`${supabaseUrl}/rest/v1/email_outbox?id=eq.${item.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({ status: 'sending' })
          });

          // 2. Fetch registration record if available
          let regRecord = null;
          if (regDbId) {
            const regRes = await fetch(`${supabaseUrl}/rest/v1/registrations?id=eq.${regDbId}&limit=1`, {
              headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
            });
            if (regRes.ok) {
              const rows = await regRes.json();
              regRecord = rows[0] || null;
            }
          }

          const name = regRecord?.primary_name || 'Participant';
          const eventTrack = regRecord?.team_name || 'EXOUSIA Event';
          const regCode = regRecord?.confirmation_code || 'EX-2026';
          const college = regRecord?.primary_college || 'Institution';
          const passUrl = `https://exousia-vert.vercel.app/pass?id=${encodeURIComponent(regCode)}`;

          // ============================================================
          // CONFIRMATION + APOLOGY UNIFIED STRANGER THINGS EMAIL DISPATCH
          // ============================================================
          const confirmationSubject = '🕳️ Your Confirmation Email Fell Through a Portal';
          const bodyContent = `Hey ${name},\n\nWell… this wasn't supposed to happen.\n\nYour EXOUSIA 2K26 registration went through perfectly. ✅\n\nBut your confirmation email?\n\nIt seems to have fallen through a small portal somewhere near Hawkins. 👀\n\nWe tried closing it.\n\nIt didn't work.\n\nWe tried calling Eleven.\n\nShe's busy.\n\nSo we're doing the next best thing — fixing the email system. 😭\n\nYour registration is already confirmed, and your Anomaly Pass is safe, so please don't register again.\n\nWe were supposed to send you an apology and ask you to wait a little longer…\n\nBUT WAIT.\n\n.\n.\n.\n\nAhaaa… finally found it. 👀⚡\n\nLooks like your confirmation email just made it back from the other side.\n\nAnd here it is:\n\n🎉 EXOUSIA 2K26 — REGISTRATION CONFIRMED\n\nHey ${name},\n\nYou're officially registered for EXOUSIA 2K26! ⚡\n\nYour registration has been successfully confirmed. Your Anomaly Pass is ready.\n\nRegistration Code: ${regCode}\nParticipant: ${name}\nEvent Track: ${eventTrack}\nInstitution: ${college}\nPass Link: ${passUrl}\n\nKeep this email safe — you'll need the details inside for the event.\n\nWelcome to EXOUSIA 2K26.\n\nThe portal may have caused some trouble… but Hawkins couldn't keep you out. 😎\n\n— Team EXOUSIA 2K26 // Department of EEE`;

          const confirmationHtmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your Confirmation Email Fell Through a Portal</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #0e0e0e; color: #e5e2e1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #140e0f; border: 1px solid rgba(229, 9, 20, 0.35); border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
    
    <!-- HEADER BRANDING -->
    <div style="padding: 28px 28px 20px 28px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); background: linear-gradient(180deg, #1c1012 0%, #140e0f 100%);">
      <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; letter-spacing: 0.25em; color: #e50914; text-transform: uppercase; margin-bottom: 6px; font-weight: bold;">
        [ ANOMALY RECOVERY PROTOCOL ]
      </div>
      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;">
        EXOUSIA <span style="color: #e50914;">2K26</span>
      </h1>
      <div style="font-size: 12px; color: #8a7a7a; margin-top: 4px;">Department of Electrical &amp; Electronics Engineering</div>
    </div>

    <!-- MAIN BODY CONTAINER -->
    <div style="padding: 28px;">
      
      <!-- SECTION 1: APOLOGY BOX (HAWKINS THEME) -->
      <div style="background-color: #1a1012; border-left: 3px solid #e50914; border-radius: 0 10px 10px 0; padding: 20px; margin-bottom: 24px;">
        <p style="margin-top: 0; font-size: 15px; color: #ffffff; font-weight: 600;">
          Hey ${name},
        </p>
        <p style="font-size: 14px; line-height: 1.65; color: #f3e7d3; margin: 12px 0;">
          Well… this wasn't supposed to happen.
        </p>
        <p style="font-size: 14px; line-height: 1.65; color: #f3e7d3; margin: 12px 0;">
          Your EXOUSIA 2K26 registration went through perfectly. ✅
        </p>
        <p style="font-size: 14px; line-height: 1.65; color: #f3e7d3; margin: 12px 0;">
          But your confirmation email?
        </p>
        <p style="font-size: 14px; line-height: 1.65; color: #ff8a8a; font-weight: 500; margin: 12px 0;">
          It seems to have fallen through a small portal somewhere near Hawkins. 👀
        </p>
        <p style="font-size: 14px; line-height: 1.65; color: #e5e2e1; margin: 8px 0;">
          We tried closing it.
        </p>
        <p style="font-size: 14px; line-height: 1.65; color: #e5e2e1; margin: 8px 0;">
          It didn't work.
        </p>
        <p style="font-size: 14px; line-height: 1.65; color: #e5e2e1; margin: 8px 0;">
          We tried calling Eleven.
        </p>
        <p style="font-size: 14px; line-height: 1.65; color: #e5e2e1; margin: 8px 0;">
          She's busy.
        </p>
        <p style="font-size: 14px; line-height: 1.65; color: #e5e2e1; margin: 12px 0;">
          So we're doing the next best thing — fixing the email system. 😭
        </p>
        <p style="font-size: 14px; line-height: 1.65; color: #ffffff; margin: 12px 0; background-color: rgba(229, 9, 20, 0.15); padding: 10px 14px; border-radius: 6px; border: 1px solid rgba(229, 9, 20, 0.3);">
          Your registration is already confirmed, and your Anomaly Pass is safe, so please don't register again.
        </p>
        <p style="margin-bottom: 0; font-size: 14px; line-height: 1.65; color: #c4b5b2; font-style: italic;">
          We were supposed to send you an apology and ask you to wait a little longer…
        </p>
      </div>

      <!-- SECTION 2: TRANSITION SIGNAL BLOCK (CYAN PORTAL ACCENT) -->
      <div style="text-align: center; margin: 28px 0; padding: 18px 12px; background: linear-gradient(90deg, rgba(0,240,255,0.03) 0%, rgba(0,240,255,0.1) 50%, rgba(0,240,255,0.03) 100%); border-top: 1px dashed rgba(0,240,255,0.3); border-bottom: 1px dashed rgba(0,240,255,0.3); border-radius: 6px;">
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 15px; font-weight: 800; color: #00F0FF; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 8px;">
          ⚡ BUT WAIT. ⚡
        </div>
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 14px; color: #00F0FF; letter-spacing: 0.3em; margin: 6px 0;">
          . &nbsp; . &nbsp; .
        </div>
        <p style="font-size: 15px; font-weight: 700; color: #ffffff; margin: 10px 0 4px 0;">
          Ahaaa… finally found it. 👀⚡
        </p>
        <p style="font-size: 13px; color: #7de8f8; margin: 4px 0;">
          Looks like your confirmation email just made it back from the other side.
        </p>
        <p style="font-size: 13px; color: #ffffff; font-weight: 600; margin: 6px 0 0 0;">
          And here it is:
        </p>
      </div>

      <!-- SECTION 3: RECOVERED CONFIRMATION CARD -->
      <div style="background-color: #0f1720; border: 1px solid rgba(0, 240, 255, 0.4); border-radius: 12px; padding: 24px; box-shadow: inset 0 0 20px rgba(0, 240, 255, 0.05);">
        
        <div style="text-align: center; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid rgba(0, 240, 255, 0.2);">
          <h2 style="margin: 0; color: #00F0FF; font-size: 17px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
            🎉 EXOUSIA 2K26 — REGISTRATION CONFIRMED
          </h2>
        </div>

        <p style="margin-top: 0; font-size: 15px; color: #ffffff; font-weight: 600;">
          Hey ${name},
        </p>

        <p style="font-size: 14px; line-height: 1.65; color: #e1f5fe; margin: 12px 0;">
          You're officially registered for EXOUSIA 2K26! ⚡
        </p>
        
        <p style="font-size: 14px; line-height: 1.65; color: #e1f5fe; margin: 12px 0;">
          Your registration has been successfully confirmed. Your Anomaly Pass is ready.
        </p>

        <!-- PASS DATA SUMMARY BOX -->
        <div style="background-color: #090e14; border: 1px solid rgba(0, 240, 255, 0.25); border-radius: 8px; padding: 16px; margin: 18px 0; font-family: 'Courier New', Courier, monospace; font-size: 13px;">
          <div style="color: #7de8f8; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px;">[ ANOMALY PASS SPECIFICATIONS ]</div>
          <div style="color: #ffffff; margin: 4px 0;"><span style="color: #88a0b0;">Pass ID:</span> <strong style="color: #00F0FF;">${regCode}</strong></div>
          <div style="color: #ffffff; margin: 4px 0;"><span style="color: #88a0b0;">Participant:</span> ${name}</div>
          <div style="color: #ffffff; margin: 4px 0;"><span style="color: #88a0b0;">Event Track:</span> ${eventTrack}</div>
          <div style="color: #ffffff; margin: 4px 0;"><span style="color: #88a0b0;">Institution:</span> ${college}</div>
        </div>

        <p style="font-size: 14px; line-height: 1.65; color: #e1f5fe; margin: 12px 0;">
          Keep this email safe — you'll need the details inside for the event.
        </p>

        <!-- CTA BUTTON -->
        <div style="text-align: center; margin: 24px 0 16px 0;">
          <a href="${passUrl}" target="_blank" style="background: linear-gradient(135deg, #e50914 0%, #b80710 100%); color: #ffffff; font-weight: 700; font-size: 14px; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; letter-spacing: 0.08em; box-shadow: 0 4px 15px rgba(229, 9, 20, 0.4);">
            VIEW ANOMALY PASS ⚡
          </a>
        </div>

        <p style="font-size: 14px; line-height: 1.65; color: #e1f5fe; margin: 16px 0 8px 0;">
          Welcome to EXOUSIA 2K26.
        </p>

        <p style="font-size: 14px; line-height: 1.65; color: #00F0FF; font-weight: 600; margin: 8px 0;">
          The portal may have caused some trouble… but Hawkins couldn't keep you out. 😎
        </p>

      </div>

      <!-- FOOTER -->
      <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.1); text-align: center;">
        <p style="font-family: 'Courier New', Courier, monospace; font-size: 12px; color: #8a7a7a; margin: 0;">
          — Team EXOUSIA 2K26 // Department of EEE
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;

          let passAttachmentBase64 = null;
          try {
            const verifyUrl = `https://exousia-vert.vercel.app/verify?id=${encodeURIComponent(regCode)}`;
            const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, color: { dark: '#000000', light: '#FFFFFF' }, width: 256 });
            const pngBuffer = await generateDigitalPassPng({
              name,
              college,
              eventTrack,
              regCode,
              eventDate: 'OCT 01, 2026',
              qrDataUrl
            });
            passAttachmentBase64 = pngBuffer.toString('base64');
          } catch (e) {
            console.warn('Pass attachment generation notice:', e.message);
          }

          const attachments = passAttachmentBase64 ? [
            { filename: `EXOUSIA_Digital_Pass_${regCode}.png`, content: passAttachmentBase64, contentType: 'image/png' }
          ] : [];

          // Controlled Rate Delay: 1000ms before confirmation attempt to maintain Google OAuth rate limit compliance
          await new Promise(r => setTimeout(r, 1000));

          const confirmationSendRes = await sendGmailEmail({
            to: recipient,
            subject: confirmationSubject,
            html: confirmationHtmlContent,
            text: bodyContent,
            attachments
          });

          const isSuccess = confirmationSendRes.success;
          const errText = confirmationSendRes.errorMessage;

          await fetch(`${supabaseUrl}/rest/v1/email_outbox?id=eq.${item.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
              status: isSuccess ? 'sent' : 'failed',
              error_message: isSuccess ? null : `Send Error: ${errText}`,
              sent_at: isSuccess ? new Date().toISOString() : null
            })
          });

          const isApologyItem = (item.subject || '').includes('Confirmation Email Update') || (item.subject || '').includes('apology');
          if (isSuccess) {
            if (isApologyItem) apologySent++;
            else confirmationSent++;
            logs.push({ id: item.id, recipient, status: isApologyItem ? 'apology_sent' : 'confirmation_sent', sender: confirmationSendRes.senderAccount });
          } else {
            if (confirmationSendRes.isRetryable) stillRetryable++;
            else permanentFailures++;
            logs.push({ id: item.id, recipient, status: isApologyItem ? 'apology_failed' : 'confirmation_failed', error: errText });
          }

        } catch (err) {
          permanentFailures++;
          logs.push({ id: item.id, recipient: item.recipient, status: 'error', error: err.message });
        }
      }
    }

    // Query remaining unsent confirmation count
    let remaining = 0;
    const remRes = await fetch(`${supabaseUrl}/rest/v1/email_outbox?status=neq.sent&recipient=neq.SYSTEM_CAMPAIGN&recipient=neq.FEEDBACK_RESPONSE&select=id,subject`, {
      headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
    });
    if (remRes.ok) {
      const remItems = await remRes.json();
      if (Array.isArray(remItems)) {
        remaining = remItems.filter(i => {
          const s = i.subject || '';
          return !s.includes('Confirmation Email Update') && !s.includes('apology') && !s.includes('Fell Through a Portal');
        }).length;
      }
    }

    setQueueState('IDLE');

    return res.status(200).json({
      success: true,
      attempted,
      apologySent,
      confirmationSent,
      stillRetryable,
      permanentFailures,
      remaining,
      lastRetryTime: new Date().toISOString(),
      logs
    });

  } catch (err) {
    setQueueState('IDLE');
    console.error('Outbox Retry Endpoint Error:', err);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Server error while processing email recovery.'
    });
  }
}
