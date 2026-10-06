// Vercel Serverless API Function — EXOUSIA Email Verification OTP Router Endpoint
// Routes: POST /api/email/send-otp & POST /api/email/verify-otp (via rewrites or direct query action)
// Security: Cryptographically secure 6-digit OTP generation, HMAC hashing, rate limiting, and Gmail API transmission.

import crypto from 'crypto';
import { sendGmailEmail } from '../../lib/gmail.js';
import { hashOtp, createOtpRecord, verifyOtpRecord } from '../../lib/otp-store.js';
import { markOtpRequested } from '../../lib/email-supervisor.js';

// In-Memory Rate Limiter per Client IP (10 req / 60s)
const ipRateLimitMap = new Map();
const IP_LIMIT_WINDOW_MS = 60000;
const MAX_IP_REQUESTS = 10;

function isIpRateLimited(clientIp) {
  if (!clientIp) return false;
  const now = Date.now();
  const timestamps = ipRateLimitMap.get(clientIp) || [];
  const validTimestamps = timestamps.filter(t => now - t < IP_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_IP_REQUESTS) {
    return true;
  }

  validTimestamps.push(now);
  ipRateLimitMap.set(clientIp, validTimestamps);
  return false;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
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

  const url = req.url || '';
  const action = req.query?.action || req.body?.action || (url.includes('verify') ? 'verify' : 'send');

  if (action === 'verify') {
    return handleVerifyOtp(req, res);
  } else {
    return handleSendOtp(req, res);
  }
}

async function handleSendOtp(req, res) {
  try {
    const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1').split(',')[0].trim();
    if (isIpRateLimited(clientIp)) {
      return res.status(429).json({
        success: false,
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many verification requests from this connection. Please wait 1 minute before trying again.'
      });
    }

    const { email } = req.body || {};
    const sanitizedEmail = (email || '').trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!sanitizedEmail || !emailRegex.test(sanitizedEmail) || sanitizedEmail.length > 255) {
      return res.status(422).json({
        success: false,
        code: 'INVALID_EMAIL',
        message: 'Please enter a valid email address.'
      });
    }

    // 1. Cryptographically Secure 6-Digit OTP Generation
    const rawOtp = String(crypto.randomInt(100000, 999999));
    const otpHash = hashOtp(sanitizedEmail, rawOtp);
    const expiresAt = new Date(Date.now() + 600000).toISOString(); // 10 Minutes Expiry

    // 2. Create Verification Record (With Resend Cooldown Check)
    const storeResult = await createOtpRecord({
      email: sanitizedEmail,
      otpHash,
      expiresAt
    });

    if (storeResult.rateLimited) {
      return res.status(429).json({
        success: false,
        code: 'RESEND_COOLDOWN_ACTIVE',
        message: storeResult.message
      });
    }

    // 3. Construct Clean, Premium HTML Email Body
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EXOUSIA 2K26 — Email Verification</title>
</head>
<body style="background-color: #0A0A0C; color: #F0F0F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px 16px; margin: 0; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 480px; margin: 0 auto; background-color: #121216; border: 1px solid #22222A; border-radius: 12px; padding: 36px 32px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);">
    
    <!-- Header -->
    <div style="border-bottom: 1px solid #1E1E26; padding-bottom: 20px; margin-bottom: 28px; text-align: center;">
      <div style="font-size: 20px; font-weight: 800; color: #E50914; letter-spacing: 3px; text-transform: uppercase;">EXOUSIA 2K26</div>
      <div style="font-size: 11px; font-weight: 600; color: #8A8A98; letter-spacing: 1.5px; margin-top: 4px; text-transform: uppercase;">Department of EEE — Technical Festival</div>
    </div>

    <!-- Title & Intro -->
    <h1 style="color: #FFFFFF; font-size: 18px; font-weight: 700; margin: 0 0 10px 0; text-align: center;">Verify your email</h1>
    <p style="color: #A0A0B0; font-size: 13px; line-height: 1.5; margin: 0 0 28px 0; text-align: center;">
      Use the verification code below to continue your EXOUSIA registration.
    </p>

    <!-- OTP Display Box -->
    <div style="background-color: #1A1A22; border: 1px solid #2A2A36; border-left: 3px solid #E50914; border-radius: 8px; padding: 20px 16px; margin-bottom: 28px; text-align: center;">
      <div style="font-family: 'SF Mono', 'Roboto Mono', 'Courier New', monospace; font-size: 32px; font-weight: 700; color: #FFFFFF; letter-spacing: 10px; margin-left: 10px;">${rawOtp}</div>
    </div>

    <!-- Details -->
    <div style="color: #A0A0B0; font-size: 12px; line-height: 1.6; text-align: center; margin-bottom: 28px;">
      <div>This code expires in <strong style="color: #F0F0F5;">10 minutes</strong>.</div>
      <div style="margin-top: 2px;">For your security, this code can only be used once.</div>
    </div>

    <!-- Security Note -->
    <div style="border-top: 1px solid #1E1E26; padding-top: 20px; text-align: center;">
      <p style="color: #6C6C78; font-size: 11px; margin: 0; line-height: 1.4;">
        If you did not request this code, you can safely ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="margin-top: 28px; padding-top: 16px; border-top: 1px dashed #1E1E26; text-align: center; font-size: 11px; color: #6C6C78; line-height: 1.5;">
      <div style="font-weight: 600; color: #8A8A98;">EXOUSIA 2K26</div>
      <div>Department of Electrical & Electronics Engineering</div>
      <div>IEI — VVITU Student Chapter</div>
    </div>

  </div>
</body>
</html>
    `.trim();

    const textBody = `EXOUSIA 2K26\nDepartment of EEE — Technical Festival\n\nVerify your email\n\nUse the verification code below to continue your EXOUSIA registration.\n\nOTP: ${rawOtp}\n\nThis code expires in 10 minutes.\nFor your security, this code can only be used once.\n\nIf you did not request this code, you can safely ignore this email.\n\nEXOUSIA 2K26\nDepartment of Electrical & Electronics Engineering\nIEI — VVITU Student Chapter`;

    // 4. Transmit via Gmail API (Priority 0 Tag)
    markOtpRequested();
    const gmailResult = await sendGmailEmail({
      to: sanitizedEmail,
      subject: 'EXOUSIA 2K26 — Your Email Verification Code',
      html: htmlBody,
      text: textBody,
      priority: 'high'
    });

    if (!gmailResult.success) {
      console.error('[OTP Email Dispatch Failed]:', gmailResult.errorMessage);
      return res.status(500).json({
        success: false,
        code: 'EMAIL_TRANSMISSION_FAILED',
        message: 'Failed to deliver verification code email. Please check your email address or try again.'
      });
    }

    console.log(`[OTP Sent Successfully] Recipient: ${sanitizedEmail} | Message ID: ${gmailResult.messageId}`);

    return res.status(200).json({
      success: true,
      message: 'Verification code sent.'
    });

  } catch (error) {
    console.error('[Send OTP Handler Error]:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred while sending the verification code.'
    });
  }
}

async function handleVerifyOtp(req, res) {
  try {
    const { email, otp } = req.body || {};
    const sanitizedEmail = (email || '').trim().toLowerCase();
    const sanitizedOtp = (otp || '').trim();

    if (!sanitizedEmail) {
      return res.status(422).json({
        success: false,
        verified: false,
        message: 'Please provide a valid email address.'
      });
    }

    if (!sanitizedOtp || sanitizedOtp.length !== 6 || !/^\d{6}$/.test(sanitizedOtp)) {
      return res.status(422).json({
        success: false,
        verified: false,
        message: 'Please enter a valid 6-digit verification code.'
      });
    }

    const result = await verifyOtpRecord({
      email: sanitizedEmail,
      inputOtp: sanitizedOtp
    });

    if (result.success && result.verified) {
      return res.status(200).json({
        success: true,
        verified: true,
        message: result.message || 'Email address successfully verified.'
      });
    }

    return res.status(400).json({
      success: false,
      verified: false,
      message: result.message || 'Invalid or expired verification code.'
    });

  } catch (error) {
    console.error('[Verify OTP Handler Error]:', error);
    return res.status(500).json({
      success: false,
      verified: false,
      message: 'An unexpected error occurred while verifying the code.'
    });
  }
}
