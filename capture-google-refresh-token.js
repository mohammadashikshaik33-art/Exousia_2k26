// EXOUSIA 2K26 — Local-Only Google OAuth Refresh Token Capture Tool
// Purpose: Safely exchange authorization code with Google and save refresh_token to OS temp directory.
// SECURITY DIRECTIVE: NEVER log, print, or expose secrets or tokens in console output or repositories.

import fs from 'fs';
import path from 'path';

function extractCleanCode(input) {
  if (!input) return '';
  let str = String(input).trim();

  // Strip surrounding quotes
  str = str.replace(/^["']|["']$/g, '').trim();

  // If user passed full callback URL or query string (e.g. https://exousia-vert.vercel.app/api/auth/google/callback?code=...&scope=...)
  if (str.includes('code=')) {
    const match = str.match(/[?&]code=([^&]+)/);
    if (match && match[1]) {
      str = match[1];
    }
  }

  // Strip any trailing query parameters if pasted with &scope=...
  if (str.includes('&')) {
    str = str.split('&')[0];
  }

  // Decode URI component if code was URL-encoded (e.g. %2F -> /)
  try {
    str = decodeURIComponent(str);
  } catch (e) {
    // Keep str as is if decode fails
  }

  return str.trim();
}

async function captureRefreshToken() {
  const rawInput = process.argv[2] || process.env.GOOGLE_AUTH_CODE;

  if (!rawInput) {
    console.error('[ ERROR ]: Please supply the Google OAuth authorization code.');
    console.error('Usage: GOOGLE_CLIENT_ID="..." GOOGLE_CLIENT_SECRET="..." node capture-google-refresh-token.js "<AUTHORIZATION_CODE_OR_CALLBACK_URL>"');
    process.exit(1);
  }

  const cleanCode = extractCleanCode(rawInput);

  if (!cleanCode) {
    console.error('[ ERROR ]: Unable to parse a valid authorization code from input.');
    process.exit(1);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.google_client_id;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.google_client_secret;

  if (!clientId || !clientSecret) {
    console.error('[ ERROR ]: Environment variables GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required.');
    console.error('Usage: GOOGLE_CLIENT_ID="..." GOOGLE_CLIENT_SECRET="..." node capture-google-refresh-token.js "<CODE>"');
    process.exit(1);
  }

  const redirectUri = 'https://exousia-vert.vercel.app/api/auth/google/callback';

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code: cleanCode,
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }).toString()
    });

    if (!tokenRes.ok) {
      const errJson = await tokenRes.json().catch(() => ({}));
      console.error('[ ERROR ]: Token exchange failed with Google OAuth.');
      console.error(`Details: ${errJson.error || 'Unknown'} - ${errJson.error_description || ''}`);
      process.exit(1);
    }

    const tokenData = await tokenRes.json();

    if (!tokenData || !tokenData.refresh_token) {
      console.error('[ ERROR ]: No refresh_token was returned by Google.');
      console.error('Note: Code may have been issued without consent prompt or already consumed.');
      process.exit(1);
    }

    const tempDir = process.env.TEMP || process.env.TMP || 'C:\\Users\\Lenovo\\AppData\\Local\\Temp';
    const tempFilePath = path.join(tempDir, 'exousia-google-refresh-token.txt');

    fs.writeFileSync(tempFilePath, tokenData.refresh_token.trim(), { encoding: 'utf8', flag: 'w' });

    console.log('Refresh token saved successfully to temporary secure file.');
  } catch (err) {
    console.error('[ ERROR ]: Unexpected exception during token exchange:', err.message);
    process.exit(1);
  }
}

captureRefreshToken();
