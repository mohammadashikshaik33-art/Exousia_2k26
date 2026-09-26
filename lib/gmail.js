// Vercel Serverless API Library — Centralized Gmail API OAuth & Transmission Engine
// Path: lib/gmail.js

export async function sendGmailEmail({ to, subject, html, text, attachments = [] }) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.google_client_id;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.google_client_secret;
    const refreshToken = process.env.google_refresh_token || process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return {
        success: false,
        messageId: null,
        errorMessage: 'Gmail API OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, google_refresh_token) are unconfigured.'
      };
    }

    // 1. Refresh Google OAuth Access Token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        refresh_token: refreshToken.trim(),
        grant_type: 'refresh_token'
      }).toString()
    });

    if (!tokenRes.ok) {
      console.error('[Gmail OAuth Error]: Token refresh HTTP failure:', tokenRes.status);
      return {
        success: false,
        messageId: null,
        errorMessage: `OAuth token refresh failed with HTTP ${tokenRes.status}`
      };
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return {
        success: false,
        messageId: null,
        errorMessage: 'OAuth endpoint did not return an access token.'
      };
    }

    // 2. Construct RFC 2822 MIME Email Message
    const recipient = Array.isArray(to) ? to.join(', ') : String(to || '').trim();
    const encodedSubject = (subject && /[^\x00-\x7F]/.test(subject))
      ? `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`
      : (subject || '');

    let rawMime = '';

    if (!attachments || attachments.length === 0) {
      rawMime = [
        `To: ${recipient}`,
        `Subject: ${encodedSubject}`,
        `Content-Type: text/html; charset="UTF-8"`,
        `MIME-Version: 1.0`,
        ``,
        html || text || ''
      ].join('\r\n');
    } else {
      const boundary = `====_EXOUSIA_MIME_BOUNDARY_${Date.now()}_====`;
      const mimeParts = [
        `To: ${recipient}`,
        `Subject: ${encodedSubject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        ``,
        `--${boundary}`,
        `Content-Type: text/html; charset="UTF-8"`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        html || text || ''
      ];

      for (const att of attachments) {
        if (!att || !att.filename || !att.content) continue;
        const contentType = att.contentType || 'image/svg+xml';
        mimeParts.push(
          ``,
          `--${boundary}`,
          `Content-Type: ${contentType}; name="${att.filename}"`,
          `Content-Disposition: attachment; filename="${att.filename}"`,
          `Content-Transfer-Encoding: base64`,
          ``,
          att.content
        );
      }

      mimeParts.push(``, `--${boundary}--`);
      rawMime = mimeParts.join('\r\n');
    }

    // 3. Base64URL Encoding (replace + with -, / with _, trim trailing =)
    const base64UrlEmail = Buffer.from(rawMime)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // 4. Dispatch Email via Gmail API (userId = "me")
    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: base64UrlEmail
      })
    });

    if (!gmailRes.ok) {
      const errTxt = await gmailRes.text();
      console.error('[Gmail API Error]: Send failed HTTP:', gmailRes.status);
      return {
        success: false,
        messageId: null,
        errorMessage: `Gmail API send failed (HTTP ${gmailRes.status}): ${errTxt}`
      };
    }

    const gmailData = await gmailRes.json();
    return {
      success: true,
      messageId: gmailData.id || null,
      errorMessage: null
    };

  } catch (err) {
    console.error('[Gmail Helper Exception]:', err.message);
    return {
      success: false,
      messageId: null,
      errorMessage: err.message || 'Unexpected Gmail API error'
    };
  }
}
