// Vercel Serverless API Function — EXOUSIA Email Outbox Safe Retry Endpoint
// Route: POST /api/admin/retry-email
// Security: Requires ADMIN_SECRET_KEY authorization token.
// Purpose: Safely retry pending/failed email outbox entries without duplicate registration creation.

import QRCode from 'qrcode';
import { sendGmailEmail } from '../../lib/gmail.js';

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
        message: 'Admin secret key is unconfigured on server.'
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

    const hasGmailCreds = (process.env.GOOGLE_CLIENT_ID || process.env.google_client_id) &&
                          (process.env.GOOGLE_CLIENT_SECRET || process.env.google_client_secret) &&
                          (process.env.google_refresh_token || process.env.GOOGLE_REFRESH_TOKEN);

    if (!hasGmailCreds && !process.env.RESEND_API_KEY) {
      return res.status(503).json({
        success: false,
        code: 'GMAIL_AUTH_UNCONFIGURED',
        message: 'Gmail API credentials are unconfigured in server environment.'
      });
    }

    // Query pending/failed email_outbox rows
    const outboxRes = await fetch(`${supabaseUrl}/rest/v1/email_outbox?status=neq.sent&limit=50`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Accept': 'application/json'
      }
    });

    if (!outboxRes.ok) {
      const errTxt = await outboxRes.text();
      return res.status(500).json({
        success: false,
        code: 'OUTBOX_QUERY_ERROR',
        message: `Failed to fetch outbox entries: ${errTxt}`
      });
    }

    const outboxItems = await outboxRes.json();
    if (!Array.isArray(outboxItems) || outboxItems.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No pending or failed email outbox entries found.',
        processed: 0,
        succeeded: 0,
        failed: 0
      });
    }

    let succeeded = 0;
    let failed = 0;
    const logs = [];

    for (const item of outboxItems) {
      try {
        const recipient = item.recipient;
        const regDbId = item.registration_id;

        // Fetch registration details
        let regRecord = null;
        if (regDbId) {
          const regRes = await fetch(`${supabaseUrl}/rest/v1/registrations?id=eq.${regDbId}&limit=1`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
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

        const emailSubject = item.subject || `EXOUSIA 2026 — Registration Confirmed | ${regCode}`;

        // Build Email HTML & Attachments
        const emailHtmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background-color:#0e0e0e; color:#e5e2e1; font-family:'Courier New',monospace; padding:24px;">
  <div style="max-width:540px; margin:0 auto; background-color:#140e0f; border:1px solid #5a403c; border-radius:12px; padding:28px;">
    <h2 style="color:#ffb4a8; font-size:22px; margin-top:0; letter-spacing:0.1em; text-transform:uppercase;">EXOUSIA 2026</h2>
    <p style="font-size:14px; color:#e3beb8;">Your registration pass confirmation resend.</p>
    
    <div style="background-color:#1c1415; border:1px solid #5a403c; border-radius:8px; padding:16px; margin:20px 0; font-size:13px; line-height:1.6;">
      <p style="margin:4px 0;"><strong style="color:#ffb4a8;">Registration ID:</strong> <span style="color:#ffffff;">${regCode}</span></p>
      <p style="margin:4px 0;"><strong style="color:#ffb4a8;">Participant:</strong> <span style="color:#ffffff;">${name}</span></p>
      <p style="margin:4px 0;"><strong style="color:#ffb4a8;">Event:</strong> <span style="color:#ffffff;">${eventTrack}</span></p>
      <p style="margin:4px 0;"><strong style="color:#ffb4a8;">College:</strong> <span style="color:#ffffff;">${college}</span></p>
    </div>

    <p style="font-size:13px; color:#e3beb8;">Your Digital Pass verification link: <a href="https://exousia-vert.vercel.app/verify?id=${encodeURIComponent(regCode)}" style="color:#ffb4a8;">https://exousia-vert.vercel.app/verify?id=${regCode}</a></p>
    
    <h3 style="color:#ffb4a8; font-size:14px; margin-top:24px; letter-spacing:0.15em;">WELCOME TO EXOUSIA.</h3>
    <p style="font-size:12px; color:#aa8984; margin-bottom:0;">EXOUSIA Team // Department of EEE</p>
  </div>
</body>
</html>`;

        let passAttachmentBase64 = null;
        try {
          const verifyUrl = `https://exousia-vert.vercel.app/verify?id=${encodeURIComponent(regCode)}`;
          const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, color: { dark: '#ffb4a8', light: '#140e0f' }, width: 140 });
          const escapeXml = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
          const passSvg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="640" height="380" viewBox="0 0 640 380"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#221215"/><stop offset="100%" stop-color="#0c0809"/></linearGradient></defs><rect width="640" height="380" fill="url(#bg)"/><rect x="12" y="12" width="616" height="356" fill="none" stroke="#ffb4a8" stroke-width="2" rx="8"/><text x="30" y="48" fill="#ffb4a8" font-family="monospace" font-weight="bold" font-size="13">EXOUSIA 2026 // PARTICIPANT CREDENTIAL</text><text x="30" y="95" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="24">${escapeXml(name.toUpperCase())}</text><text x="30" y="125" fill="#c5a4a0" font-family="monospace" font-size="14">${escapeXml(college)}</text><text x="30" y="190" fill="#ffb4a8" font-family="monospace" font-weight="bold" font-size="18">REG ID: ${escapeXml(regCode)}</text><text x="30" y="225" fill="#e5e2e1" font-family="monospace" font-size="14">EVENT: ${escapeXml(eventTrack)}</text><text x="30" y="260" fill="#4ade80" font-family="monospace" font-weight="bold" font-size="14">STATUS: CONFIRMED</text><image href="${qrDataUrl}" xlink:href="${qrDataUrl}" x="460" y="40" width="140" height="140"/><text x="500" y="200" fill="#ffb4a8" font-family="monospace" font-size="10">QR VERIFY</text></svg>`.trim();
          passAttachmentBase64 = Buffer.from(passSvg).toString('base64');
        } catch (e) {
          console.warn('SVG QR err:', e);
        }

        const attachments = passAttachmentBase64 ? [
          { filename: `EXOUSIA_Digital_Pass_${regCode}.svg`, content: passAttachmentBase64, contentType: 'image/svg+xml' }
        ] : [];

        const gmailResult = await sendGmailEmail({
          to: recipient,
          subject: emailSubject,
          html: emailHtmlBody,
          text: `EXOUSIA 2026 Confirmation — Reg ID: ${regCode}`,
          attachments
        });

        const isSuccess = gmailResult.success;
        const errText = gmailResult.errorMessage;

        // Update email_outbox row
        await fetch(`${supabaseUrl}/rest/v1/email_outbox?id=eq.${item.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            status: isSuccess ? 'sent' : 'failed',
            error_message: isSuccess ? null : `Retry Error: ${errText}`,
            sent_at: isSuccess ? new Date().toISOString() : null
          })
        });

        if (isSuccess) {
          succeeded++;
          logs.push({ id: item.id, recipient, status: 'sent' });
        } else {
          failed++;
          logs.push({ id: item.id, recipient, status: 'failed', error: errText });
        }

      } catch (err) {
        failed++;
        logs.push({ id: item.id, recipient: item.recipient, status: 'error', error: err.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Outbox retry loop completed. Processed ${outboxItems.length} emails.`,
      processed: outboxItems.length,
      succeeded,
      failed,
      logs
    });

  } catch (err) {
    console.error('Outbox Retry Endpoint Error:', err);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Server error while retrying outbox emails.'
    });
  }
}
