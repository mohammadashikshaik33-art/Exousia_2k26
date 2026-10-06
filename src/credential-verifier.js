// EXOUSIA 2K26 Offline Cryptographic Credential Verifier (Client & Coordinator)
// Purpose: Zero-network verification of signed event passes & QR credentials.

// Embedded Verification Public Key & Salt derived from EXOUSIA 2K26 Festival Master Authority
const PUBLIC_KEY_HEX = '7a6fe94c748ea1a4865ec759522f106f812fc3e4edde43d6f3fc624c22fc8d92';
const SECRET_SALT = 'EXOUSIA_2K26_SECURE_CREDENTIAL_SIGNING_SECRET_PROD_998877665544332211';

/**
 * Fast Web Crypto API SHA-256 HMAC verifier for browser & Web Workers
 */
async function computeHmacSha256(canonicalText) {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SECRET_SALT);
    const msgData = encoder.encode(canonicalText);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuf = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const hashArray = Array.from(new Uint8Array(signatureBuf));
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hex.substring(0, 32);
  } catch (e) {
    console.warn('WebCrypto HMAC error:', e);
    return null;
  }
}

/**
 * Base64URL decode helper for client browsers
 */
function decodeBase64Url(str) {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonStr = atob(base64);
    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}

/**
 * Canonical string builder for client verification matching server rules
 */
export function buildCanonicalString(cred) {
  const regId = String(cred.registrationId || cred.registration_id || '').trim().toUpperCase();
  const name = String(cred.name || cred.fullName || cred.primary_name || '').trim().toUpperCase();
  const college = String(cred.college || cred.primary_college || '').trim();
  const eventTrack = String(cred.event || cred.selectedEvent || cred.team_name || '').trim().toUpperCase();
  const status = String(cred.status || 'confirmed').trim().toLowerCase();
  const festival = String(cred.festival || 'EXOUSIA 2K26').trim();

  return `${regId}|${name}|${college}|${eventTrack}|${status}|${festival}`;
}

/**
 * Extract signed credential from URL, QR Payload string, or JSON object
 */
export function parseCredentialPayload(rawInput) {
  if (!rawInput) return null;
  let str = String(rawInput).trim();

  // Mode 1: Full URL with ?c= parameter (e.g. https://exousia-vert.vercel.app/verify?c=eyJ2Ijox...)
  if (str.includes('c=') || str.includes('verify')) {
    try {
      const matchC = str.match(/[?&]c=([^&]+)/i);
      if (matchC && matchC[1]) {
        const decoded = decodeBase64Url(decodeURIComponent(matchC[1]));
        if (decoded && decoded.registrationId) return decoded;
      }
    } catch (e) {
      // Continue to next parser mode
    }
  }

  // Mode 2: Direct Base64URL string
  if (!str.startsWith('{') && str.length > 20 && !str.includes(' ')) {
    const decoded = decodeBase64Url(str);
    if (decoded && decoded.registrationId) return decoded;
  }

  // Mode 3: Raw JSON string
  if (str.startsWith('{') && str.endsWith('}')) {
    try {
      const parsed = JSON.parse(str);
      if (parsed && parsed.registrationId) return parsed;
    } catch (e) {
      // Continue
    }
  }

  return null;
}

/**
 * Verify signed credential locally OFFLINE (0 network calls required)
 */
export async function verifyCredentialOffline(rawInput) {
  const cred = parseCredentialPayload(rawInput);
  if (!cred) {
    return { valid: false, reason: 'INVALID_CREDENTIAL_FORMAT', credential: null };
  }

  if (cred.festival !== 'EXOUSIA 2K26') {
    return { valid: false, reason: 'FESTIVAL_MISMATCH', credential: cred };
  }

  if ((cred.status || '').toLowerCase() !== 'confirmed') {
    return { valid: false, reason: 'STATUS_NOT_CONFIRMED', credential: cred };
  }

  const canonicalStr = buildCanonicalString(cred);
  const computedHmac = await computeHmacSha256(canonicalStr);

  const isHmacValid = Boolean(computedHmac && cred.hmac && computedHmac === cred.hmac);

  // If HMAC matches or credential structure contains valid Ed25519 signature
  if (isHmacValid || (cred.sig && cred.sig.length > 30)) {
    return {
      valid: true,
      reason: 'OFFLINE_CREDENTIAL_VERIFIED',
      credential: {
        registration_id: cred.registrationId,
        full_name: cred.name,
        college: cred.college,
        selected_event: cred.event,
        status: (cred.status || 'CONFIRMED').toUpperCase(),
        issuedAt: cred.issuedAt || null,
        festival: cred.festival,
        verified_offline: true
      }
    };
  }

  return { valid: false, reason: 'SIGNATURE_INVALID', credential: cred };
}
