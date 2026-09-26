// Vercel Serverless API Function — Isolated Gmail API Test Sender
// Route: POST /api/admin/test-gmail
// Security: Requires ADMIN_SECRET_KEY authorization. Sends one isolated test email via Gmail API.

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

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method Not Allowed. Use POST.'
    });
  }

  try {
    // 1. Admin Authorization Verification
    const adminSecret = process.env.ADMIN_SECRET_KEY;
    if (!adminSecret) {
      return res.status(503).json({
        success: false,
        code: 'ADMIN_UNCONFIGURED',
        message: 'ADMIN_SECRET_KEY is unconfigured on server.'
      });
    }

    const rawAuth = req.headers.authorization || req.headers['x-admin-secret'] || req.query?.secret || req.body?.adminSecret || '';
    const providedToken = String(rawAuth).replace(/^Bearer\s+/i, '').trim();

    if (!providedToken || providedToken !== adminSecret) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Access denied. Valid admin authorization required.'
      });
    }

    // 2. Test Recipient Validation
    const recipient = (req.body?.to || req.body?.recipient || req.query?.to || req.query?.recipient || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!recipient || !emailRegex.test(recipient)) {
      return res.status(422).json({
        success: false,
        code: 'INVALID_RECIPIENT',
        message: 'Please provide a valid test recipient email address in request body (e.g. {"to": "qa@domain.com"}).'
      });
    }

    // 3. Environment Variables Check
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.google_client_id;
    const gClientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.google_client_secret;
    const gRefreshToken = process.env.google_refresh_token || process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !gClientSecret || !gRefreshToken) {
      return res.status(503).json({
        success: false,
        code: 'GMAIL_AUTH_UNCONFIGURED',
        message: 'Gmail API credentials (google_client_id, google_client_secret, google_refresh_token) are unconfigured.'
      });
    }

    // 4. Exchange Refresh Token for Access Token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId.trim(),
        client_secret: gClientSecret.trim(),
        refresh_token: gRefreshToken.trim(),
        grant_type: 'refresh_token'
      }).toString()
    });

    if (!tokenRes.ok) {
      console.error('[Gmail Test]: Access token refresh request failed with HTTP', tokenRes.status);
      return res.status(500).json({
        success: false,
        code: 'ACCESS_TOKEN_REFRESH_FAILED',
        message: 'Failed to obtain fresh access token from Google OAuth endpoint.'
      });
    }

    const tokenData = await tokenRes.json();
    const gAccessToken = tokenData.access_token;

    if (!gAccessToken) {
      return res.status(500).json({
        success: false,
        code: 'NO_ACCESS_TOKEN_RETURNED',
        message: 'Google OAuth response did not contain access token.'
      });
    }

    // 5. Construct RFC 2822 Raw Email
    const rawEmail = [
      `To: ${recipient}`,
      `Subject: EXOUSIA Gmail API Test`,
      `Content-Type: text/plain; charset="UTF-8"`,
      `MIME-Version: 1.0`,
      ``,
      `This is a one-time Gmail API delivery test for EXOUSIA 2K26.`,
      `If you received this email, Gmail API OAuth is working correctly.`
    ].join('\r\n');

    const base64UrlEmail = Buffer.from(rawEmail)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // 6. Send Email via Gmail API (userId = "me")
    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: base64UrlEmail
      })
    });

    if (!gmailRes.ok) {
      const errTxt = await gmailRes.text();
      console.error('[Gmail Test]: Gmail API send failed with HTTP', gmailRes.status);
      return res.status(500).json({
        success: false,
        code: 'GMAIL_SEND_FAILED',
        message: `Gmail API messages.send failed: ${errTxt}`
      });
    }

    const gmailData = await gmailRes.json();

    // 7. Safe Diagnostic Response (Zero secrets or tokens exposed)
    return res.status(200).json({
      success: true,
      message: 'Test email sent successfully via Gmail API.',
      recipient: recipient,
      messageId: gmailData.id || null,
      threadId: gmailData.threadId || null
    });

  } catch (error) {
    console.error('[Gmail Test Exception]:', error.message);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected server error while processing Gmail API test transmission.'
    });
  }
}
