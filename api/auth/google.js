// Vercel Serverless API Function — Google OAuth Authorization Start & Callback Endpoint
// Routes:
//   GET /api/auth/google/start
//   GET /api/auth/google/callback
// Purpose: Initiates OAuth flow, exchanges authorization code for refresh tokens, and identifies the authorized Gmail user (Primary vs Backup).

export default async function handler(req, res) {
  const url = req.url || '';
  const action = req.query?.action || (url.includes('callback') ? 'callback' : 'start');

  if (action === 'start' || url.includes('/start')) {
    return handleStart(req, res);
  } else {
    return handleCallback(req, res);
  }
}

function handleStart(req, res) {
  const clientId = (process.env.GOOGLE_CLIENT_ID || process.env.google_client_id || '').trim();

  if (!clientId) {
    return res.status(503).json({
      success: false,
      code: 'GOOGLE_AUTH_UNCONFIGURED',
      message: 'GOOGLE_CLIENT_ID environment variable is missing on server.'
    });
  }

  const redirectUri = 'https://exousia-vert.vercel.app/api/auth/google/callback';
  const scope = 'https://www.googleapis.com/auth/gmail.send';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    scope: scope
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  res.writeHead(302, { Location: authUrl });
  res.end();
}

async function handleCallback(req, res) {
  if (req.query && req.query.error) {
    console.warn('[Google OAuth Callback]: Authorization was canceled or denied by user.');
    return res.status(400).json({
      success: false,
      code: 'OAUTH_AUTHORIZATION_DENIED',
      message: 'Google OAuth authorization was denied or canceled.'
    });
  }

  const code = req.query ? req.query.code : null;
  if (!code) {
    return res.status(400).json({
      success: false,
      code: 'MISSING_AUTHORIZATION_CODE',
      message: 'Authorization code missing in callback request.'
    });
  }

  const clientId = (process.env.GOOGLE_CLIENT_ID || process.env.google_client_id || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || process.env.google_client_secret || '').trim();
  const redirectUri = 'https://exousia-vert.vercel.app/api/auth/google/callback';

  let refreshToken = null;
  let accessToken = null;
  let userEmail = 'Unknown Gmail Account';
  let tokenError = null;

  if (clientId && clientSecret) {
    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        }).toString()
      });

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        refreshToken = tokenData.refresh_token || null;
        accessToken = tokenData.access_token || null;

        if (accessToken) {
          const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (profileRes.ok) {
            const profile = await profileRes.json();
            userEmail = profile.emailAddress || userEmail;
          }
        }
      } else {
        const errText = await tokenRes.text();
        tokenError = `Token exchange HTTP ${tokenRes.status}: ${errText}`;
      }
    } catch (err) {
      tokenError = `Token exchange exception: ${err.message}`;
    }
  }

  const targetEnvVar = userEmail.toLowerCase().includes('backup')
    ? 'BACKUP_GOOGLE_REFRESH_TOKEN'
    : 'PRIMARY_GOOGLE_REFRESH_TOKEN / google_refresh_token';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Google OAuth Authorization Complete — EXOUSIA 2K26</title>
  <style>
    body {
      background-color: #0e0e0e;
      color: #e5e2e1;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 40px 20px;
      margin: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
    }
    .card {
      max-width: 620px;
      width: 100%;
      background-color: #140e0f;
      border: 1.5px solid #4ade80;
      border-radius: 14px;
      padding: 36px 28px;
      text-align: center;
      box-shadow: 0 0 30px rgba(74, 222, 128, 0.2);
    }
    h2 {
      color: #4ade80;
      font-size: 20px;
      margin-top: 0;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .email-badge {
      display: inline-block;
      margin: 12px 0 20px 0;
      padding: 8px 18px;
      background: rgba(74, 222, 128, 0.15);
      border: 1px solid rgba(74, 222, 128, 0.4);
      border-radius: 20px;
      color: #4ade80;
      font-size: 14px;
      font-weight: bold;
    }
    p {
      font-size: 13px;
      color: #d1d5db;
      line-height: 1.6;
      margin: 10px 0;
    }
    .code-box {
      background: #1c1415;
      border: 1px solid #5a403c;
      padding: 14px;
      border-radius: 8px;
      color: #ffb4a8;
      word-break: break-all;
      margin: 16px 0;
      font-size: 12px;
      font-family: monospace;
      user-select: all;
      text-align: left;
    }
    .copy-btn {
      background-color: #4ade80;
      color: #0e0e0e;
      border: none;
      padding: 10px 20px;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 10px;
      font-size: 12px;
    }
    .copy-btn:hover {
      background-color: #22c55e;
    }
    .note {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 20px;
      border-top: 1px solid #2a2022;
      padding-top: 14px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2>Google OAuth Authorization Complete</h2>
    <div class="email-badge">✓ Authenticated: ${userEmail}</div>
    
    ${refreshToken ? `
      <p>A fresh offline refresh token has been generated for this account. Set this secret in Vercel Environment Variables as <strong>${targetEnvVar}</strong>:</p>
      <div class="code-box" id="token-box">${refreshToken}</div>
      <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('token-box').innerText); alert('Refresh Token copied to clipboard!');">COPY REFRESH TOKEN</button>
    ` : `
      <p style="color: #f87171;">Authorization Code Received (${code.substring(0, 12)}...). If a refresh token was not returned, Google Cloud consent screen prompt may need forcing.</p>
      ${tokenError ? `<div class="code-box">${tokenError}</div>` : ''}
    `}

    <div class="note">
      EXOUSIA 2K26 Dual Sender OAuth Desk — Department of Electrical & Electronics Engineering
    </div>
  </div>
</body>
</html>
  `.trim());
}
