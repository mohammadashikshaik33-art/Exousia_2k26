// Vercel Serverless API Function — EXOUSIA Production Registration Endpoint
// Route: POST /api/register
// Architecture: Server-side validation, unique ID generation, Supabase Postgres insertion, 409 duplicate handling, and 503 unconfigured responses.

import QRCode from 'qrcode';
import { sendGmailEmail } from '../lib/gmail.js';

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
    const { fullName, email, phone, college, selectedEvent } = req.body || {};

    // 1. Server-Side Input Normalization
    const sanitizedName = (fullName || '').trim();
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
          idempotency_key: `IDEM-${finalRegId}-${sanitizedEmail}`,
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

      const emailSubject = `EXOUSIA 2026 — Registration Confirmed | ${responseRegId}`;
      const emailTextBody = 
`EXOUSIA 2026

Your registration has been successfully confirmed.

Registration ID:
${responseRegId}

Participant:
${sanitizedName}

Event:
${normalizedTrack}

Venue:
${eventVenue}

Date:
${eventDate}

Please keep your Digital Pass ready when you arrive at EXOUSIA.

Your Digital Pass is attached to this email.

WELCOME TO EXOUSIA.

EXOUSIA Team`;

      const emailHtmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="background-color:#0e0e0e; color:#e5e2e1; font-family:'Courier New',monospace; padding:24px;">
  <div style="max-width:540px; margin:0 auto; background-color:#140e0f; border:1px solid #5a403c; border-radius:12px; padding:28px;">
    <h2 style="color:#ffb4a8; font-size:22px; margin-top:0; letter-spacing:0.1em; text-transform:uppercase;">EXOUSIA 2026</h2>
    <p style="font-size:14px; color:#e3beb8;">Your registration has been successfully confirmed.</p>
    
    <div style="background-color:#1c1415; border:1px solid #5a403c; border-radius:8px; padding:16px; margin:20px 0; font-size:13px; line-height:1.6;">
      <p style="margin:4px 0;"><strong style="color:#ffb4a8;">Registration ID:</strong> <span style="color:#ffffff;">${responseRegId}</span></p>
      <p style="margin:4px 0;"><strong style="color:#ffb4a8;">Participant:</strong> <span style="color:#ffffff;">${sanitizedName}</span></p>
      <p style="margin:4px 0;"><strong style="color:#ffb4a8;">Event:</strong> <span style="color:#ffffff;">${normalizedTrack}</span></p>
      <p style="margin:4px 0;"><strong style="color:#ffb4a8;">Venue:</strong> <span style="color:#ffffff;">${eventVenue}</span></p>
      <p style="margin:4px 0;"><strong style="color:#ffb4a8;">Date:</strong> <span style="color:#ffffff;">${eventDate}</span></p>
    </div>

    <p style="font-size:13px; color:#e3beb8;">Please keep your Digital Pass ready when you arrive at EXOUSIA.</p>
    <p style="font-size:13px; color:#e3beb8;">Your Digital Pass verification link: <a href="https://exousia-vert.vercel.app/verify?id=${encodeURIComponent(responseRegId)}" style="color:#ffb4a8;">https://exousia-vert.vercel.app/verify?id=${responseRegId}</a></p>
    <p style="font-size:13px; color:#e3beb8;">Your Digital Pass is attached to this email.</p>
    
    <h3 style="color:#ffb4a8; font-size:14px; margin-top:24px; letter-spacing:0.15em;">WELCOME TO EXOUSIA.</h3>
    <p style="font-size:12px; color:#aa8984; margin-bottom:0;">EXOUSIA Team // Department of EEE</p>
  </div>
</body>
</html>`;

      // Generate Digital Pass SVG Attachment
      let passAttachmentBase64 = null;
      try {
        const verifyUrl = `https://exousia-vert.vercel.app/verify?id=${encodeURIComponent(responseRegId)}`;
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
          margin: 1,
          color: { dark: '#ffb4a8', light: '#140e0f' },
          width: 140
        });

        const escapeXml = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

        const passSvgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="640" height="380" viewBox="0 0 640 380">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#221215" />
      <stop offset="100%" stop-color="#0c0809" />
    </linearGradient>
  </defs>
  <rect width="640" height="380" fill="url(#bg)" />
  <rect x="12" y="12" width="616" height="356" fill="none" stroke="#ffb4a8" stroke-width="2" rx="8" />
  
  <text x="30" y="48" fill="#ffb4a8" font-family="monospace" font-weight="bold" font-size="13">EXOUSIA 2026 // PARTICIPANT CREDENTIAL</text>
  <text x="30" y="95" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="24">${escapeXml(sanitizedName.toUpperCase())}</text>
  <text x="30" y="125" fill="#c5a4a0" font-family="monospace" font-size="14">${escapeXml(sanitizedCollege)}</text>
  <text x="30" y="190" fill="#ffb4a8" font-family="monospace" font-weight="bold" font-size="18">REG ID: ${escapeXml(responseRegId)}</text>
  <text x="30" y="225" fill="#e5e2e1" font-family="monospace" font-size="14">EVENT: ${escapeXml(normalizedTrack)}</text>
  <text x="30" y="260" fill="#4ade80" font-family="monospace" font-weight="bold" font-size="14">STATUS: CONFIRMED</text>
  <text x="30" y="330" fill="#ffb4a8" font-family="monospace" font-size="11">DATE: ${escapeXml(eventDate)} | VENUE: ${escapeXml(eventVenue)}</text>
  
  <image href="${qrDataUrl}" xlink:href="${qrDataUrl}" x="460" y="40" width="140" height="140" />
  <text x="500" y="200" fill="#ffb4a8" font-family="monospace" font-size="10">QR VERIFY</text>
</svg>`.trim();

        passAttachmentBase64 = Buffer.from(passSvgContent).toString('base64');
      } catch (passErr) {
        console.warn('Pass SVG attachment generation error:', passErr);
      }

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

      // 5b. Attempt Gmail API Transmission
      let emailSent = false;
      let emailErrorMsg = null;

      const attachments = passAttachmentBase64 ? [
        {
          filename: `EXOUSIA_Digital_Pass_${responseRegId}.svg`,
          content: passAttachmentBase64,
          contentType: 'image/svg+xml'
        }
      ] : [];

      const gmailResult = await sendGmailEmail({
        to: sanitizedEmail,
        subject: emailSubject,
        html: emailHtmlBody,
        text: emailTextBody,
        attachments
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
