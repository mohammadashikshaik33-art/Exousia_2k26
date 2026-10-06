# EXOUSIA 2K26 — EVENT-DAY OPERATOR RUNBOOK

## Quick Reference for Event Organizers, Desk Leads & Tech Teams

---

### SCENARIO 1: Participant says "I registered but didn't receive my confirmation email"

> [!IMPORTANT]
> **Participant Registration Remains Valid Even If Email Delivery Is Delayed.**

1. **Do NOT ask the participant to register again.**
2. Open the **Coordinator Desk** (`/coordinator`) or **Admin Desk** (`/admin.html`).
3. Search by participant Name, College, or Phone Number.
4. Verify that their registration status is `CONFIRMED`.
5. Direct the participant to view their digital Anomaly File at:
   `https://exousia-vert.vercel.app/pass?id=EX-2026-XXXXXX`
6. Alternatively, scan their QR code directly from their mobile screen or registration receipt.

---

### SCENARIO 2: Email OTP Delivery is Failing / Delayed

1. Open the **Organizer Admin Control Desk** (`/admin.html`).
2. Log in with your authorized **Admin Secret Key**.
3. Inspect the **EMAIL DELIVERY & SELF-HEALING SUPERVISOR** panel:
   - Check **PRIMARY GMAIL** circuit status.
   - If Primary Gmail shows `RATE LIMITED` or `OPEN`:
     - Press **PAUSE BULK QUEUE** to immediately pause background outbox recovery and preserve all remaining capacity for P0 OTP sends.
     - Press **TEST PRIMARY** to execute a controlled diagnostic test.
4. Explain to participants that verification emails are queued under rate protection and will resume automatically when the rate limit window clears.

---

### SCENARIO 3: Coordinator Roster Unreachable Due to Poor Campus Network

1. Prior to event start, all coordinators must open `/coordinator` while online.
2. Click **DOWNLOAD OFFLINE ROSTER SNAPSHOT**.
3. In case of network drop, the Coordinator Desk operates 100% offline from local IndexedDB cache.
4. QR Verification and Participant Search continue working without active internet.

---

### SCENARIO 4: Recovering Stuck Email Queues

1. Open `/admin.html`.
2. Locate the **EMAIL DELIVERY & SELF-HEALING SUPERVISOR** panel.
3. Click **RECOVER STUCK QUEUE**.
4. The system will safely restore items stuck in `sending` state (>10 minutes) back to `pending` without duplicating already-sent emails.

---

### EMERGENCY CONTACT & ESCALATION

- **Technical Lead**: Team EXOUSIA EEE
- **Admin Control Desk**: `https://exousia-vert.vercel.app/admin.html`
- **System Health Status**: `https://exousia-vert.vercel.app/api/status`
