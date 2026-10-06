# EXOUSIA 2K26 — OTP Disabled Files & Restoration Documentation

## Executive Overview

To prevent registration blockages caused by Gmail API rate limits, temporary delivery delays, or provider quotas during peak participant access for EXOUSIA 2K26, **all mandatory Email OTP verification requirements have been temporarily disabled across the application**.

The system now operates in **Instant Registration Mode**:
1. Participant fills in the registration form.
2. Participant clicks **SECURE CREDENTIALS**.
3. Registration record is instantly stored in Supabase Postgres and confirmation pass is generated.
4. Confirmation email is queued in `email_outbox` for background self-healing delivery (via Primary Gmail, Backup Gmail, or Resend).
5. Registrations succeed regardless of email delivery speed or provider availability.

---

## Audited Files & Component Status

### 1. `api/email/otp.js`
- **Purpose**: Vercel Serverless Function handling `action=send` (generating & emailing 6-digit OTPs) and `action=verify` (validating submitted OTP codes).
- **Current Status**: **Disabled / Standby**. Endpoint remains present for potential admin or future verification restoration, but is no longer called during participant registration flow.
- **Dependencies**: Imports `saveOtp`, `verifyOtpCode` from `lib/otp-store.js`, and `sendGmailEmail` from `lib/gmail.js`.

### 2. `lib/otp-store.js`
- **Purpose**: OTP storage and verification helper managing transient 6-digit OTP codes with 10-minute expiry in memory (`globalThis.__EXOUSIA_OTP_STORE__`) and Supabase `email_verifications` table.
- **Current Status**: **Bypassed / Standby**. `isEmailVerified(email)` helper function is bypassed on `/api/register`.
- **Dependencies**: Supabase Postgres `email_verifications` table.

### 3. `supabase/migrations/20260926000000_email_verifications.sql`
- **Purpose**: Database schema migration creating `email_verifications` table storing email, OTP hash, verification status, and timestamps.
- **Current Status**: **Preserved**. Table and schema remain intact in Supabase database. No data deleted or corrupted.

### 4. `api/register.js`
- **Purpose**: Primary registration serverless endpoint (`POST /api/register`).
- **Current Modification**: Removed `isEmailVerified` check from server-side validation. Allows direct database insertion without requiring prior verification in `email_verifications`.
- **Status**: **Active (OTP Verification Removed)**.

### 5. `index.html`
- **Purpose**: Registration UI modal in public website.
- **Current Modification**: Removed `VERIFY EMAIL` button, hidden `otp-input-container` chamber, hidden OTP timers, status messages, and `VERIFY OTP` / `RESEND OTP` controls. Form now leads directly to registration submission.
- **Status**: **Active (UI Simplified for Instant Submission)**.

### 6. `src/main.js`
- **Purpose**: Client-side logic for registration form validation, event day selection, and submission handling.
- **Current Modification**: Updated `validateRegistrationForm()` to allow immediate submission once Name, Email, Phone, College, and Event fields are filled, without requiring `isEmailVerifiedState === true`.
- **Status**: **Active (Instant Validation Mode)**.

---

## Restoration Instructions (How to Re-Enable OTP Verification)

If email provider quotas are restored or mandatory OTP verification is requested in the future, follow these exact steps to re-enable OTP:

### Step 1: Re-enable Server-Side Verification Check in `api/register.js`
1. Re-import `isEmailVerified` at top of file:
   ```javascript
   import { isEmailVerified } from '../lib/otp-store.js';
   ```
2. Re-insert the verification guard before insertion:
   ```javascript
   const emailVerified = await isEmailVerified(sanitizedEmail);
   if (!emailVerified) {
     return res.status(400).json({
       success: false,
       error: 'EMAIL_NOT_VERIFIED',
       message: 'Please verify your email address before registering.'
     });
   }
   ```

### Step 2: Un-hide OTP UI in `index.html`
1. Restore the `VERIFY EMAIL` button next to the email input (`#otp-send-btn`).
2. Restore the `#otp-input-container` div containing code inputs, timer display (`#otp-timer-display`), `#otp-verify-btn`, and `#otp-resend-btn`.

### Step 3: Re-enable Client Validation in `src/main.js`
1. Restore `isEmailVerifiedState` requirement in `validateRegistrationForm()`:
   ```javascript
   const isVerified = isEmailVerifiedState === true && regEmail && regEmail.value.trim().toLowerCase() === verifiedEmailAddress;
   ```
2. Re-attach event handlers for `#otp-send-btn`, `#otp-verify-btn`, and countdown timers.

### Step 4: Re-deploy & Verify
1. Run `npm run build`
2. Run `npx vercel --prod --yes`
3. Execute end-to-end smoke test verifying OTP email send and code entry.
