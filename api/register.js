// Vercel Serverless API Function — EXOUSIA Production Registration Endpoint
// Route: POST /api/register
// Architecture: Server-side validation, unique ID generation, Supabase Postgres insertion, 409 duplicate handling, and 503 unconfigured responses.

import QRCode from 'qrcode';
import { sendGmailEmail } from '../lib/gmail.js';
import { generateDigitalPassSvg, generateDigitalPassPng } from '../lib/digital-pass.js';
import { createSignedCredential } from '../lib/credential-signer.js';

// Phase 4: Server-Side Rate Limiter (In-Memory Sliding Window per IP)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 10000; // 10 seconds
const MAX_REQUESTS_PER_WINDOW = 15; // Conservative 15 req/10s limit per client IP

function isRateLimited(clientIp) {
  if (!clientIp) return false;
  const now = Date.now();
  const timestamps = rateLimitMap.get(clientIp) || [];
  const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  validTimestamps.push(now);
  rateLimitMap.set(clientIp, validTimestamps);

  // Periodic map pruning
  if (rateLimitMap.size > 2000) {
    for (const [ip, tsList] of rateLimitMap.entries()) {
      if (tsList.every(t => now - t >= RATE_LIMIT_WINDOW_MS)) {
        rateLimitMap.delete(ip);
      }
    }
  }
  return false;
}

export default async function handler(req, res) {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version'
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

  // Phase 4 Rate Limiting Check
  const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1').split(',')[0].trim();
  if (isRateLimited(clientIp)) {
    console.warn(`[RATE_LIMIT_EXCEEDED] Client IP: ${clientIp} exceeded registration threshold.`);
    res.setHeader('Retry-After', '10');
    return res.status(429).json({
      success: false,
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many registration requests from this connection. Please wait 10 seconds before trying again.'
    });
  }

  try {
    const { fullName, name, email, phone, college, selectedEvent } = req.body || {};

    // 1. Server-Side Input Normalization
    const sanitizedName = (fullName || name || '').trim();
    const sanitizedEmail = (email || '').trim().toLowerCase();
    const sanitizedPhone = (phone || '').trim();
    const sanitizedCollege = (college || '').trim();
    const sanitizedTrack = (selectedEvent || '').trim();

    // 2. Server-Side Validation Rules
    if (!sanitizedName || sanitizedName.length < 2 || sanitizedName.length > 120) {
      return res.status(422).json({
        success: false,
        code: 'INVALID_NAME',
        message: 'Please provide a valid full name (2-120 characters).'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!sanitizedEmail || !emailRegex.test(sanitizedEmail)) {
      return res.status(422).json({
        success: false,
        code: 'INVALID_EMAIL',
        message: 'Please provide a valid email address.'
      });
    }

    if (!sanitizedPhone || sanitizedPhone.length < 7 || sanitizedPhone.length > 20) {
      return res.status(422).json({
        success: false,
        code: 'INVALID_PHONE',
        message: 'Please provide a valid phone number (7-20 digits).'
      });
    }

    if (!sanitizedCollege || sanitizedCollege.length > 255) {
      return res.status(422).json({
        success: false,
        code: 'INVALID_COLLEGE',
        message: 'Please provide a valid institution name.'
      });
    }

    // 2b. Server-Side Event Allowlist Validation (Matches index.html select options exactly)
    const ALLOWED_EVENT_TRACKS = [
      'CLUE\'D UP',
      'HAWKINS TRAP',
      'DARK PROTOCOL',
      'DARK PORTAL',
      'GENOVA',
      'NEXORA',
      'CLUE\'D UP (DAY 1)',
      'HAWKINS TRAP (DAY 1)',
      'DARK PROTOCOL (DAY 2)',
      'DARK PORTAL (DAY 2)',
      'GENOVA (DAY 2)',
      'NEXORA (DAY 2)',
      'AI SYMPOSIUM (DAY 1)',
      'HACKATHON: BREACH (DAY 2)',
      'SPOT ANOMALIES (ONGOING)',
      'POWER PICK',
      'SMART SHIFT',
      'HALE PICK',
      'CAP RESCUE',
      'CODE UNO',
      'FLIP & ORDER',
      'TAPPLE',
      'SIZZLE',
      'ROLL IT'
    ];

    const normalizedTrack = sanitizedTrack.toUpperCase();
    if (!ALLOWED_EVENT_TRACKS.includes(normalizedTrack)) {
      return res.status(422).json({
        success: false,
        code: 'INVALID_EVENT',
        message: 'The selected event track is not available.'
      });
    }

    // 3. Supabase Database Canonical Environment Variable Check (Server-side ONLY)
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      // Database unconfigured state: Return 503 Service Unavailable (No fake success!)
      return res.status(503).json({
        success: false,
        code: 'DATABASE_UNCONFIGURED',
        message: 'Registration database service is currently unconfigured. Please notify event organizers.'
      });
    }

    // 3a. Server-Side Maintenance, Registration Open/Closed & Emergency Mode Enforcement
    try {
      const festStatusRes = await fetch(`${supabaseUrl}/rest/v1/festival_editions?select=registration_status,theme&limit=1`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      if (festStatusRes.ok) {
        const festRows = await festStatusRes.json();
        if (Array.isArray(festRows) && festRows.length > 0) {
          const fest = festRows[0];
          const themeStr = String(fest.theme || '');
          const regStatus = String(fest.registration_status || '').toLowerCase();

          let emergencyUrl = null;
          if (themeStr.includes('EMERGENCY_URL=')) {
            emergencyUrl = themeStr.split('EMERGENCY_URL=')[1].split(';')[0].trim();
          }

          if (regStatus === 'emergency' || themeStr.toUpperCase().includes('EMERGENCY')) {
            return res.status(503).json({
              success: false,
              code: 'EMERGENCY_MODE_ACTIVE',
              message: 'Primary registration is currently in emergency mode. Please use the official emergency registration link.',
              emergency_url: emergencyUrl
            });
          }

          if (themeStr.toUpperCase().includes('MAINTENANCE')) {
            return res.status(503).json({
              success: false,
              code: 'WEBSITE_MAINTENANCE',
              message: 'EXOUSIA portal is currently undergoing system maintenance. Registrations are temporarily paused.'
            });
          }

          if (regStatus === 'closed') {
            return res.status(403).json({
              success: false,
              code: 'REGISTRATION_CLOSED',
              message: 'Registrations for EXOUSIA 2026 are currently closed.'
            });
          }
        }
      }
    } catch (statusErr) {
      console.warn('Status check fetch error, continuing registration:', statusErr);
    }

    // 3b. Server-Side Duplicate Registration Check (Email + Selected Event)
    const dupCheckResponse = await fetch(
      `${supabaseUrl}/rest/v1/registrations?primary_email=eq.${encodeURIComponent(sanitizedEmail)}&team_name=eq.${encodeURIComponent(normalizedTrack)}&select=id`,
      {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Accept': 'application/json'
        }
      }
    );

    if (dupCheckResponse.ok) {
      const existing = await dupCheckResponse.json();
      if (Array.isArray(existing) && existing.length > 0) {
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_REGISTRATION',
          message: 'A registration for this email address and selected event track already exists.'
        });
      }
    }

    // Helper to generate a 6-character random alphanumeric suffix
    const generateId = () => {
      const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let suffix = '';
      for (let i = 0; i < 6; i++) {
        suffix += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      return `EX-2026-${suffix}`;
    };

    // 4. Registration Insertion with Bounded ID Collision Retry Loop (Max 5 Attempts)
    const createdAt = new Date().toISOString();
    let dbResponse = null;
    let finalRegId = '';
    const maxAttempts = 5;
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;
      finalRegId = generateId();

      dbResponse = await fetch(`${supabaseUrl}/rest/v1/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          festival_id: 'e1801f5e-1a22-4a0b-8d07-8e6dfd158700',
          confirmation_code: finalRegId,
          idempotency_key: `IDEM-${sanitizedEmail}-${normalizedTrack}`,
          registration_kind: 'event-only',
          primary_name: sanitizedName,
          primary_email: sanitizedEmail,
          primary_phone: sanitizedPhone,
          primary_college: sanitizedCollege,
          primary_department: 'EEE',
          primary_year: '2026',
          team_name: normalizedTrack,
          status: 'confirmed',
          created_at: createdAt
        })
      });

      if (dbResponse.status === 409) {
        const errorBody = await dbResponse.text();
        // If conflict is due to duplicate email + event composite constraint or idempotency key, return 409
        if (errorBody.includes('primary_email') || errorBody.includes('email') || errorBody.includes('idempotency_key')) {
          return res.status(409).json({
            success: false,
            code: 'DUPLICATE_REGISTRATION',
            message: 'A registration for this email and selected event already exists.'
          });
        }
        // Otherwise, collision was on confirmation_code -> retry loop continues
        console.warn(`Registration ID collision detected on ${finalRegId}, retrying attempt ${attempt}/${maxAttempts}...`);
      } else {
        break;
      }
    }

    if (attempt >= maxAttempts && dbResponse && dbResponse.status === 409) {
      return res.status(500).json({
        success: false,
        code: 'ID_GENERATION_FAILED',
        message: 'System busy. Unable to allocate a unique registration ID. Please try again.'
      });
    }

    if (!dbResponse || !dbResponse.ok) {
      const dbErrorText = dbResponse ? await dbResponse.text() : 'No response from DB';
      console.error('Database write error:', dbErrorText);
      return res.status(500).json({
        success: false,
        code: 'DATABASE_WRITE_ERROR',
        message: 'Failed to record registration in database. Please try again.'
      });
    }

    const insertedData = await dbResponse.json().catch(() => ([]));
    const confirmedRecord = insertedData[0] || {};
    const responseRegId = confirmedRecord.confirmation_code || confirmedRecord.registration_id || finalRegId;

    // 5. Automated Email Confirmation & Supabase Email Outbox Logging (Async, Safe, Independent)
    try {
      // Event Metadata Mapping
      let eventDate = 'September 30, 2026';
      let eventVenue = 'Loyalty – 3 Block (C-Block)';

      if (normalizedTrack.includes('GENOVA') || normalizedTrack.includes('NEXORA')) {
        eventDate = 'October 1, 2026';
        eventVenue = 'Computer Lab';
      } else if (normalizedTrack.includes('DARK PROTOCOL')) {
        eventDate = 'October 1, 2026';
        eventVenue = 'Loyalty – 3 Block (C-Block)';
      } else if (normalizedTrack.includes('AI SYMPOSIUM')) {
        eventDate = 'September 30, 2026';
        eventVenue = 'Seminar Hall';
      } else if (normalizedTrack.includes('DAY 2')) {
        eventDate = 'October 1, 2026';
      }

      const emailSubject = `EXOUSIA 2K26 — Registration Confirmed | ${responseRegId}`;
      const passUrl = `https://exousia-vert.vercel.app/pass?id=${encodeURIComponent(responseRegId)}`;

      const emailTextBody = 
`EXOUSIA 2K26 — ANOMALY FILE GENERATED

Your registration has been successfully confirmed.

YOUR ANOMALY FILE HAS BEEN GENERATED.

Registration ID: ${responseRegId}
Participant: ${sanitizedName}
Event: ${normalizedTrack}
College: ${sanitizedCollege}
Venue: ${eventVenue}
Date: ${eventDate}

VIEW ANOMALY FILE:
${passUrl}

WELCOME TO EXOUSIA.

Department of Electrical & Electronics Engineering
EXOUSIA 2K26 Team`;

      const emailHtmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="background-color:#050709; color:#F0F0F5; font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; padding:24px; margin:0;">
  <div style="max-width:540px; margin:0 auto; background-color:#0C0E12; border:1px solid #E50914; border-radius:16px; padding:32px; box-shadow:0 8px 32px rgba(229,9,20,0.2);">
    
    <div style="border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:16px; margin-bottom:24px;">
      <div style="color:#E50914; font-size:22px; font-weight:800; tracking-widest:2px; text-transform:uppercase;">EXOUSIA 2K26</div>
      <div style="font-size:11px; color:#8D929A; text-transform:uppercase; margin-top:4px; font-family:monospace;">Department of EEE — Technical Festival</div>
    </div>

    <h2 style="color:#FFFFFF; font-size:20px; font-weight:800; margin:0 0 8px 0; text-transform:uppercase;">REGISTRATION CONFIRMED</h2>
    <div style="display:inline-block; background-color:rgba(229,9,20,0.15); border:1px solid rgba(229,9,20,0.4); color:#E50914; font-size:11px; font-weight:700; font-family:monospace; padding:4px 10px; border-radius:6px; margin-bottom:20px;">
      ● YOUR ANOMALY FILE HAS BEEN GENERATED
    </div>
    
    <div style="background-color:#141A21; border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:20px; margin-bottom:24px; font-size:13px; line-height:1.7; font-family:monospace;">
      <p style="margin:4px 0;"><strong style="color:#8D929A;">CASE ID:</strong> <span style="color:#FFFFFF; font-weight:700;">${responseRegId}</span></p>
      <p style="margin:4px 0;"><strong style="color:#8D929A;">SUBJECT:</strong> <span style="color:#FFFFFF;">${sanitizedName}</span></p>
      <p style="margin:4px 0;"><strong style="color:#8D929A;">ORIGIN:</strong> <span style="color:#FFFFFF;">${sanitizedCollege}</span></p>
      <p style="margin:4px 0;"><strong style="color:#8D929A;">ASSIGNED EVENT:</strong> <span style="color:#E50914; font-weight:700;">${normalizedTrack}</span></p>
      <p style="margin:4px 0;"><strong style="color:#8D929A;">VENUE:</strong> <span style="color:#F0F0F5;">${eventVenue}</span></p>
      <p style="margin:4px 0;"><strong style="color:#8D929A;">EVENT DATE:</strong> <span style="color:#F0F0F5;">${eventDate}</span></p>
    </div>

    <div style="margin-bottom:24px; text-align:center;">
      <a href="${passUrl}" style="display:block; width:100%; box-sizing:border-box; background-color:#E50914; color:#FFFFFF; text-decoration:none; font-weight:800; font-size:13px; font-family:monospace; text-transform:uppercase; padding:14px 20px; border-radius:10px; text-align:center;">
        [ VIEW ANOMALY FILE ]
      </a>
    </div>

    <div style="border-top:1px solid rgba(255,255,255,0.1); padding-top:20px; text-align:center; font-size:11px; color:#8D929A; font-family:monospace;">
      <div style="font-weight:700; color:#F0F0F5;">WELCOME TO EXOUSIA</div>
      <div>Department of Electrical &amp; Electronics Engineering</div>
    </div>

  </div>
</body>
</html>`;

      // 5a. Create Outbox Record FIRST (Status: pending)
      let outboxRowId = null;
      if (confirmedRecord.id && supabaseUrl && supabaseKey) {
        try {
          const outboxPostRes = await fetch(`${supabaseUrl}/rest/v1/email_outbox`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({
              registration_id: confirmedRecord.id,
              recipient: sanitizedEmail,
              subject: emailSubject,
              body: emailTextBody,
              status: 'pending',
              error_message: null,
              sent_at: null
            })
          });

          if (outboxPostRes.ok) {
            const outboxRows = await outboxPostRes.json().catch(() => ([]));
            outboxRowId = outboxRows[0]?.id || null;
          }
        } catch (outboxInsertErr) {
          console.warn('email_outbox initial insert non-blocking error:', outboxInsertErr);
        }
      }

      // 5b. Attempt Gmail API Transmission (No image attachment required)
      let emailSent = false;
      let emailErrorMsg = null;

      const gmailResult = await sendGmailEmail({
        to: sanitizedEmail,
        subject: emailSubject,
        html: emailHtmlBody,
        text: emailTextBody,
        attachments: []
      });

      emailSent = gmailResult.success;
      emailErrorMsg = gmailResult.errorMessage;

      // 5c. Update (PATCH) Outbox Record with Transmission Status
      if (outboxRowId && supabaseUrl && supabaseKey) {
        await fetch(`${supabaseUrl}/rest/v1/email_outbox?id=eq.${outboxRowId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            status: emailSent ? 'sent' : 'failed',
            error_message: emailErrorMsg,
            sent_at: emailSent ? new Date().toISOString() : null
          })
        }).catch((outboxErr) => console.warn('email_outbox patch non-blocking error:', outboxErr));
      }

    } catch (emailOutboxError) {
      // Email delivery error is isolated and NEVER breaks successful registration response
      console.warn('Non-blocking Email Dispatch Error:', emailOutboxError);
    }

    // 5d. Generate Cryptographically Signed Event Credential
    let signedCredential = null;
    try {
      signedCredential = createSignedCredential({
        registrationId: responseRegId,
        name: confirmedRecord.primary_name || sanitizedName,
        college: confirmedRecord.primary_college || sanitizedCollege,
        event: confirmedRecord.team_name || normalizedTrack,
        status: confirmedRecord.status || 'confirmed',
        created_at: confirmedRecord.created_at || createdAt
      });
    } catch (credErr) {
      console.warn('Non-blocking signed credential generation error:', credErr);
    }

    // 6. Structured 201 Created Success Response
    return res.status(201).json({
      success: true,
      status: (confirmedRecord.status || 'confirmed').toUpperCase(),
      registration_id: responseRegId,
      created_at: confirmedRecord.created_at || createdAt,
      participant: {
        fullName: confirmedRecord.primary_name || sanitizedName,
        email: confirmedRecord.primary_email || sanitizedEmail,
        college: confirmedRecord.primary_college || sanitizedCollege,
        selectedEvent: confirmedRecord.team_name || normalizedTrack
      },
      signed_credential: signedCredential,
      message: 'Registration successfully recorded in EXOUSIA database.'
    });

  } catch (error) {
    console.error('Serverless Endpoint Error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred while processing registration.'
    });
  }
}
