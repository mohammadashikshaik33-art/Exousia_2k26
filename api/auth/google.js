// Vercel Serverless API Function — Google OAuth Authorization Start & Callback Endpoint
// Routes:
//   GET /api/auth/google/start
//   GET /api/auth/google/callback
// Purpose: Initiates OAuth flow and displays unconsumed authorization code for local capture tool.

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
  const clientId = process.env.google_client_id || process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return res.status(503).json({
      success: false,
      code: 'GOOGLE_AUTH_UNCONFIGURED',
      message: 'google_client_id environment variable is missing on server.'
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
  // 1. Check for OAuth error returned by Google consent prompt
  if (req.query && req.query.error) {
    console.warn('[Google OAuth Callback]: Authorization was canceled or denied by user.');
    return res.status(400).json({
      success: false,
      code: 'OAUTH_AUTHORIZATION_DENIED',
      message: 'Google OAuth authorization was denied or canceled.'
    });
  }

  // 2. Read authorization code
  const code = req.query ? req.query.code : null;
  if (!code) {
    return res.status(400).json({
      success: false,
      code: 'MISSING_AUTHORIZATION_CODE',
      message: 'Authorization code missing in callback request.'
    });
  }

  // 3. Render Authorization Code page so user can copy unconsumed code for local capture script
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Google OAuth Authorization Code Received</title>
  <style>
    body {
      background-color: #0e0e0e;
      color: #e5e2e1;
      font-family: 'Courier New', monospace;
      padding: 40px 20px;
      margin: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
    }
    .card {
      max-width: 580px;
      width: 100%;
      background-color: #140e0f;
      border: 1.5px solid #4ade80;
      border-radius: 14px;
      padding: 36px 28px;
      text-align: center;
      box-shadow: 0 0 25px rgba(74, 222, 128, 0.25);
    }
    h2 {
      color: #4ade80;
      font-size: 20px;
      margin-top: 0;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    p {
      font-size: 13px;
      color: #d1d5db;
      line-height: 1.6;
      margin-top: 16px;
    }
    .code-box {
      background: #1c1415;
      border: 1px solid #5a403c;
      padding: 16px;
      border-radius: 8px;
      color: #ffb4a8;
      word-break: break-all;
      margin: 20px 0;
      font-size: 13px;
      user-select: all;
    }
    .badge {
      display: inline-block;
      margin-top: 16px;
      padding: 6px 14px;
      background: rgba(74, 222, 128, 0.15);
      border: 1px solid rgba(74, 222, 128, 0.4);
      border-radius: 8px;
      color: #4ade80;
      font-size: 11px;
      letter-spacing: 0.15em;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2>Authorization Code Received</h2>
    <p>Google OAuth authorization succeeded. Copy the authorization code below and run your local token capture script:</p>
    <div class="code-box">${code}</div>
    <div class="badge">SINGLE-USE AUTHORIZATION CODE READY</div>
  </div>
</body>
</html>
  `.trim());
}
