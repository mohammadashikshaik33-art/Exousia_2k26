// Vercel Serverless API Library — Centralized Email OTP Verification Storage Engine
// Path: lib/otp-store.js
// Dual-Target Strategy: Prefers public.email_verifications table, seamlessly falls back to public.registrations table (team_name = 'EMAIL_VERIFICATION') if table is not yet created.

import crypto from 'crypto';

function getSupabaseCredentials() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  return { supabaseUrl, supabaseKey };
}

export function hashOtp(email, otp) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const secret = process.env.OTP_HMAC_SECRET || 'EXOUSIA_OTP_SECRET_KEY_2026';
  return crypto.createHmac('sha256', secret).update(`${normalizedEmail}:${otp}`).digest('hex');
}

export async function createOtpRecord({ email, otpHash, expiresAt }) {
  const { supabaseUrl, supabaseKey } = getSupabaseCredentials();
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Database connection unconfigured.');
  }

  const normalizedEmail = (email || '').trim().toLowerCase();
  const nowIso = new Date().toISOString();

  // 1. Try public.email_verifications first
  try {
    const checkEv = new URLSearchParams();
    checkEv.set('select', 'id,created_at,last_sent_at');
    checkEv.set('email', `eq.${normalizedEmail}`);
    checkEv.set('order', 'created_at.desc');
    checkEv.set('limit', '1');

    const evRes = await fetch(`${supabaseUrl}/rest/v1/email_verifications?${checkEv.toString()}`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    });

    if (evRes.ok) {
      const existing = await evRes.json();
      if (Array.isArray(existing) && existing.length > 0) {
        const lastSent = new Date(existing[0].last_sent_at || existing[0].created_at).getTime();
        const elapsedMs = Date.now() - lastSent;
        if (elapsedMs < 30000) {
          const remainingSec = Math.ceil((30000 - elapsedMs) / 1000);
          return {
            rateLimited: true,
            remainingSec,
            message: `Please wait ${remainingSec} seconds before requesting a new verification code.`
          };
        }
      }

      // Insert into email_verifications
      const recordId = crypto.randomUUID();
      const insertEv = await fetch(`${supabaseUrl}/rest/v1/email_verifications`, {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          id: recordId,
          email: normalizedEmail,
          otp_hash: otpHash,
          expires_at: expiresAt,
          attempts: 0,
          max_attempts: 5,
          created_at: nowIso,
          last_sent_at: nowIso,
          used: false
        })
      });

      if (insertEv.ok) {
        return { rateLimited: false, success: true };
      }
    }
  } catch (evErr) {
    console.warn('[OTP Store]: email_verifications table attempt failed, falling back to registrations store:', evErr);
  }

  // 2. Fallback to public.registrations store
  const queryCheck = new URLSearchParams();
  queryCheck.set('select', 'id,created_at,last_sent_at,team_name');
  queryCheck.set('primary_email', `eq.${normalizedEmail}`);
  queryCheck.set('team_name', 'eq.EMAIL_VERIFICATION');
  queryCheck.set('order', 'created_at.desc');
  queryCheck.set('limit', '1');

  const checkRes = await fetch(`${supabaseUrl}/rest/v1/registrations?${queryCheck.toString()}`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  });

  if (checkRes.ok) {
    const existing = await checkRes.json();
    if (Array.isArray(existing) && existing.length > 0) {
      const lastSent = new Date(existing[0].last_sent_at || existing[0].created_at).getTime();
      const elapsedMs = Date.now() - lastSent;
      if (elapsedMs < 30000) {
        const remainingSec = Math.ceil((30000 - elapsedMs) / 1000);
        return {
          rateLimited: true,
          remainingSec,
          message: `Please wait ${remainingSec} seconds before requesting a new verification code.`
        };
      }
    }
  }

  const uniqueCode = `OTP-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const recordId = crypto.randomUUID();

  const otpPayload = {
    id: recordId,
    festival_id: 'e1801f5e-1a22-4a0b-8d07-8e6dfd158700',
    confirmation_code: uniqueCode,
    idempotency_key: `OTP-REC-${normalizedEmail}-${Date.now()}`,
    registration_kind: 'event-only',
    primary_name: 'OTP Verification Request',
    primary_email: normalizedEmail,
    primary_phone: '0000000000',
    primary_college: 'EXOUSIA System',
    primary_department: 'EEE',
    primary_year: '2026',
    status: 'pending',
    team_name: 'EMAIL_VERIFICATION',
    team_members: {
      otp_hash: otpHash,
      expires_at: expiresAt,
      attempts: 0,
      max_attempts: 5,
      verified: false,
      verified_at: null,
      used: false,
      last_sent_at: nowIso
    },
    created_at: nowIso
  };

  const insertRes = await fetch(`${supabaseUrl}/rest/v1/registrations`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(otpPayload)
  });

  if (!insertRes.ok) {
    const errText = await insertRes.text();
    console.error('[OTP Store Error]: Failed to create OTP record:', errText);
    throw new Error(`Failed to store OTP verification state: ${errText}`);
  }

  return { rateLimited: false, success: true };
}

export async function verifyOtpRecord({ email, inputOtp }) {
  const { supabaseUrl, supabaseKey } = getSupabaseCredentials();
  if (!supabaseUrl || !supabaseKey) {
    return { success: false, verified: false, message: 'Database service unconfigured.' };
  }

  const normalizedEmail = (email || '').trim().toLowerCase();
  const cleanOtp = (inputOtp || '').trim();

  if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    return { success: false, verified: false, message: 'Verification code must be 6 digits.' };
  }

  // 1. Try public.email_verifications first
  try {
    const queryEv = new URLSearchParams();
    queryEv.set('select', 'id,otp_hash,expires_at,attempts,max_attempts,used,verified_at');
    queryEv.set('email', `eq.${normalizedEmail}`);
    queryEv.set('order', 'created_at.desc');
    queryEv.set('limit', '1');

    const evRes = await fetch(`${supabaseUrl}/rest/v1/email_verifications?${queryEv.toString()}`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    });

    if (evRes.ok) {
      const records = await evRes.json();
      if (Array.isArray(records) && records.length > 0) {
        const rec = records[0];
        if (rec.used || rec.verified_at) {
          return { success: false, verified: false, message: 'This verification code has already been used.' };
        }
        if (Date.now() > new Date(rec.expires_at).getTime()) {
          return { success: false, verified: false, message: 'This verification code has expired. Please request a new code.' };
        }
        if (rec.attempts >= rec.max_attempts) {
          return { success: false, verified: false, message: 'Maximum attempts exceeded. Please request a new code.' };
        }

        const expectedHash = rec.otp_hash;
        const computedHash = hashOtp(normalizedEmail, cleanOtp);
        const hashMatch = crypto.timingSafeEqual(Buffer.from(computedHash, 'utf8'), Buffer.from(expectedHash || '', 'utf8'));

        if (!hashMatch) {
          await fetch(`${supabaseUrl}/rest/v1/email_verifications?id=eq.${rec.id}`, {
            method: 'PATCH',
            headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ attempts: rec.attempts + 1 })
          });
          const remaining = rec.max_attempts - (rec.attempts + 1);
          return { success: false, verified: false, message: remaining > 0 ? `Incorrect verification code. ${remaining} attempt(s) remaining.` : 'Too many attempts. Please request a new code.' };
        }

        await fetch(`${supabaseUrl}/rest/v1/email_verifications?id=eq.${rec.id}`, {
          method: 'PATCH',
          headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ used: true, verified_at: new Date().toISOString() })
        });

        return { success: true, verified: true, message: 'Email address successfully verified.' };
      }
    }
  } catch (evErr) {
    console.warn('[OTP Store]: email_verifications verify attempt failed, falling back:', evErr);
  }

  // 2. Fallback to public.registrations store
  const queryParams = new URLSearchParams();
  queryParams.set('select', 'id,team_members,created_at,status');
  queryParams.set('primary_email', `eq.${normalizedEmail}`);
  queryParams.set('team_name', 'eq.EMAIL_VERIFICATION');
  queryParams.set('order', 'created_at.desc');
  queryParams.set('limit', '1');

  const fetchRes = await fetch(`${supabaseUrl}/rest/v1/registrations?${queryParams.toString()}`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  });

  if (!fetchRes.ok) {
    return { success: false, verified: false, message: 'Failed to retrieve verification record.' };
  }

  const records = await fetchRes.json();
  if (!Array.isArray(records) || records.length === 0) {
    return { success: false, verified: false, message: 'No verification code request found for this email address.' };
  }

  const record = records[0];
  const recId = record.id;
  const meta = record.team_members || {};

  if (meta.used || meta.verified) {
    return { success: false, verified: false, message: 'This verification code has already been used.' };
  }

  const nowMs = Date.now();
  const expiresMs = new Date(meta.expires_at || 0).getTime();

  if (nowMs > expiresMs) {
    return { success: false, verified: false, message: 'This verification code has expired. Please request a new code.' };
  }

  const attempts = parseInt(meta.attempts || 0, 10);
  const maxAttempts = parseInt(meta.max_attempts || 5, 10);

  if (attempts >= maxAttempts) {
    return { success: false, verified: false, message: 'Too many attempts. Please request a new code.' };
  }

  const expectedHash = meta.otp_hash;
  const computedHash = hashOtp(normalizedEmail, cleanOtp);

  const hashMatch = crypto.timingSafeEqual(
    Buffer.from(computedHash, 'utf8'),
    Buffer.from(expectedHash || '', 'utf8')
  );

  if (!hashMatch) {
    const updatedMeta = { ...meta, attempts: attempts + 1 };
    await fetch(`${supabaseUrl}/rest/v1/registrations?id=eq.${recId}`, {
      method: 'PATCH',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ team_members: updatedMeta })
    });

    const remainingAttempts = maxAttempts - (attempts + 1);
    return {
      success: false,
      verified: false,
      message: remainingAttempts > 0
        ? `Incorrect verification code. ${remainingAttempts} attempt(s) remaining.`
        : 'Too many attempts. Please request a new code.'
    };
  }

  const updatedMeta = {
    ...meta,
    verified: true,
    verified_at: new Date().toISOString(),
    used: true
  };

  await fetch(`${supabaseUrl}/rest/v1/registrations?id=eq.${recId}`, {
    method: 'PATCH',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      team_members: updatedMeta
    })
  });

  return { success: true, verified: true, message: 'Email address successfully verified.' };
}

export async function isEmailVerified(email) {
  const { supabaseUrl, supabaseKey } = getSupabaseCredentials();
  if (!supabaseUrl || !supabaseKey) return false;

  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail) return false;

  // 1. Check email_verifications table
  try {
    const queryEv = new URLSearchParams();
    queryEv.set('select', 'id,verified_at,used');
    queryEv.set('email', `eq.${normalizedEmail}`);
    queryEv.set('used', 'eq.true');
    queryEv.set('order', 'created_at.desc');
    queryEv.set('limit', '1');

    const evRes = await fetch(`${supabaseUrl}/rest/v1/email_verifications?${queryEv.toString()}`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
    });

    if (evRes.ok) {
      const records = await evRes.json();
      if (Array.isArray(records) && records.length > 0) {
        const verifiedAtMs = new Date(records[0].verified_at || 0).getTime();
        const elapsedMs = Date.now() - verifiedAtMs;
        if (elapsedMs >= 0 && elapsedMs <= 1800000) {
          return true;
        }
      }
    }
  } catch (e) {
    // Ignore and fallback
  }

  // 2. Check registrations fallback store
  const queryParams = new URLSearchParams();
  queryParams.set('select', 'id,team_members,created_at,status');
  queryParams.set('primary_email', `eq.${normalizedEmail}`);
  queryParams.set('team_name', 'eq.EMAIL_VERIFICATION');
  queryParams.set('order', 'created_at.desc');
  queryParams.set('limit', '1');

  const res = await fetch(`${supabaseUrl}/rest/v1/registrations?${queryParams.toString()}`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  });

  if (!res.ok) return false;

  const records = await res.json();
  if (!Array.isArray(records) || records.length === 0) return false;

  const meta = records[0].team_members || {};
  if (!meta.verified || !meta.verified_at) return false;

  const verifiedAtMs = new Date(meta.verified_at).getTime();
  const elapsedMs = Date.now() - verifiedAtMs;

  return elapsedMs >= 0 && elapsedMs <= 1800000;
}
