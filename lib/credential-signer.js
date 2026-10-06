import crypto from 'crypto';

// Server-side Credential Signing Module for EXOUSIA 2K26
const SECRET_KEY = process.env.CREDENTIAL_SIGNING_KEY || 'EXOUSIA_2K26_SECURE_CREDENTIAL_SIGNING_SECRET_PROD_998877665544332211';

// Derive Ed25519 KeyPair from SHA-256 seed of secret
const seed = crypto.createHash('sha256').update(SECRET_KEY).digest();
const ed25519PrivateKey = crypto.createPrivateKey({
  key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]),
  format: 'der',
  type: 'pkcs8'
});
const ed25519PublicKey = crypto.createPublicKey(ed25519PrivateKey);
const publicSpkiDer = ed25519PublicKey.export({ type: 'spki', format: 'der' });
const PUBLIC_KEY_HEX = publicSpkiDer.subarray(-32).toString('hex');

/**
 * Get canonical string representation for payload signing to prevent tampering
 */
export function getCanonicalPayloadString(data) {
  const regId = String(data.registrationId || data.registration_id || '').trim().toUpperCase();
  const name = String(data.name || data.fullName || data.primary_name || '').trim().toUpperCase();
  const college = String(data.college || data.primary_college || '').trim();
  const eventTrack = String(data.event || data.selectedEvent || data.team_name || '').trim().toUpperCase();
  const status = String(data.status || 'confirmed').trim().toLowerCase();
  const festival = String(data.festival || 'EXOUSIA 2K26').trim();

  return `${regId}|${name}|${college}|${eventTrack}|${status}|${festival}`;
}

/**
 * Sign credential data using Ed25519 & HMAC-SHA256 dual signatures
 */
export function createSignedCredential(regData) {
  const regId = String(regData.registrationId || regData.registration_code || regData.confirmation_code || regData.id || '').trim().toUpperCase();
  const name = String(regData.name || regData.fullName || regData.primary_name || '').trim();
  const college = String(regData.college || regData.primary_college || '').trim();
  const event = String(regData.event || regData.selectedEvent || regData.team_name || '').trim();
  const status = String(regData.status || 'confirmed').trim().toLowerCase();
  const festival = 'EXOUSIA 2K26';
  const issuedAt = regData.created_at || new Date().toISOString();

  const canonicalStr = getCanonicalPayloadString({ registrationId: regId, name, college, event, status, festival });

  // 1. Ed25519 Cryptographic Signature
  const edSigBuf = crypto.sign(null, Buffer.from(canonicalStr), ed25519PrivateKey);
  const ed25519Sig = edSigBuf.toString('base64url');

  // 2. HMAC-SHA256 Signature (for ultra-fast zero-dependency client verification)
  const hmacSig = crypto.createHmac('sha256', SECRET_KEY).update(canonicalStr).digest('hex').substring(0, 32);

  const credentialObj = {
    v: 1,
    festival,
    registrationId: regId,
    name,
    college,
    event,
    status,
    issuedAt,
    sig: ed25519Sig,
    hmac: hmacSig
  };

  const payloadJson = JSON.stringify(credentialObj);
  const encodedPayload = Buffer.from(payloadJson).toString('base64url');

  return {
    raw: credentialObj,
    encodedPayload,
    qrUrl: `https://exousia-vert.vercel.app/verify?c=${encodedPayload}`,
    publicKeyHex: PUBLIC_KEY_HEX
  };
}

/**
 * Verify signed credential on the server side
 */
export function verifySignedCredential(credentialData) {
  try {
    let credObj = credentialData;
    if (typeof credentialData === 'string') {
      let jsonStr = credentialData;
      if (!jsonStr.startsWith('{')) {
        jsonStr = Buffer.from(credentialData, 'base64url').toString('utf8');
      }
      credObj = JSON.parse(jsonStr);
    }

    if (!credObj || !credObj.registrationId || !credObj.sig) {
      return { valid: false, reason: 'INVALID_CREDENTIAL_STRUCTURE' };
    }

    if (credObj.festival !== 'EXOUSIA 2K26') {
      return { valid: false, reason: 'FESTIVAL_MISMATCH' };
    }

    if ((credObj.status || '').toLowerCase() !== 'confirmed') {
      return { valid: false, reason: 'STATUS_NOT_CONFIRMED' };
    }

    const canonicalStr = getCanonicalPayloadString({
      registrationId: credObj.registrationId,
      name: credObj.name,
      college: credObj.college,
      event: credObj.event,
      status: credObj.status,
      festival: credObj.festival
    });

    // Verify HMAC-SHA256
    const expectedHmac = crypto.createHmac('sha256', SECRET_KEY).update(canonicalStr).digest('hex').substring(0, 32);
    const hmacMatches = credObj.hmac === expectedHmac;

    // Verify Ed25519 Signature
    const sigBuf = Buffer.from(credObj.sig, 'base64url');
    const ed25519Valid = crypto.verify(null, Buffer.from(canonicalStr), ed25519PublicKey, sigBuf);

    if (ed25519Valid || hmacMatches) {
      return { valid: true, credential: credObj };
    }

    return { valid: false, reason: 'SIGNATURE_VERIFICATION_FAILED' };

  } catch (err) {
    return { valid: false, reason: `PARSE_ERROR: ${err.message}` };
  }
}

export function getPublicKeyHex() {
  return PUBLIC_KEY_HEX;
}
