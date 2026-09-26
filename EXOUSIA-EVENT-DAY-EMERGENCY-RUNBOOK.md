# EXOUSIA 2K26 — EVENT-DAY EMERGENCY OPERATIONAL RUNBOOK

**Production URL**: [https://exousia-vert.vercel.app/](https://exousia-vert.vercel.app/)  
**Target Scale**: ~8,000 Participants | Event Dates: September 30 – October 1, 2026  
**Primary Venue**: Loyalty – 3 Block (C-Block) & Computer Lab (GENOVA)

---

## EMERGENCY CONTACT MATRIX

| Role | Name | Phone Number | Responsibility |
| :--- | :--- | :--- | :--- |
| **Faculty Convenor** | Dr. A.V. Naresh Babu | — | Overall Event Decision Authority |
| **Faculty Convenor** | M. Srikanth | — | Technical Event Oversight |
| **Student Convenor** | D. Kranthi Kumar Naik | — | Student Operations & Escalations |
| **Registrations Head** | Lahari | 86883 95490 | Registration Desk & Manual Entry |
| **Events Lead** | Revanth | 86882 88699 | Technical Track Coordination |
| **Hospitality Lead** | Lalitha | 74167 91013 | Participant Support Desk |
| **Transport Lead** | Vali | 63034 34682 | Campus Mobility & Entry Desk |

---

## SCENARIO RESPONSE PROCEDURES (A – L)

### Scenario A: Website Down / Unreachable
- **Symptoms**: Browser displays HTTP 502/503/504 or "DNS_PROBE_FINISHED_NXDOMAIN".
- **First Check**: Check Vercel status page ([https://www.vercel-status.com/](https://www.vercel-status.com/)).
- **Second Check**: Test live URL on cellular network (bypass campus Wi-Fi).
- **Immediate Action**: If Vercel CDN issue, use Vercel CLI to inspect last deployment alias or re-alias:
  ```bash
  npx vercel alias set <previous-deployment-url> exousia-vert.vercel.app
  ```
- **Fallback**: Direct participants to use the printed posters / QR code pointing to emergency registration form.
- **Recovery**: Restore alias to latest healthy build once Vercel status is GREEN.

---

### Scenario B: Registration API Down
- **Symptoms**: Form submission returns 500/503 error or spinner spins indefinitely.
- **First Check**: Open browser Developer Tools → Network tab → Inspect response from `/api/register`.
- **Second Check**: Check Supabase REST API reachability.
- **Immediate Action**: Access Admin Dashboard (`/admin`), open **System Control Panel**, and set **EMERGENCY MODE** to `ENABLED` with an Emergency Google Form URL.
- **Fallback**: Website automatically presents emergency registration banner linking participants to the backup form.
- **Recovery**: Disable Emergency Mode once API returns 201 Created.

---

### Scenario C: Supabase Unavailable / Database Down
- **Symptoms**: `/api/register`, `/api/verify-registration`, and `/api/admin/registrations` return 503 "DATABASE_UNCONFIGURED" or 500 error.
- **First Check**: Check Supabase Dashboard ([https://supabase.com/dashboard/project/zmtsxawynjxeyufoqkyy](https://supabase.com/dashboard/project/zmtsxawynjxeyufoqkyy)).
- **Second Check**: Check database connection status in Supabase project metrics.
- **Immediate Action**: Enable **EMERGENCY REGISTRATION MODE** in Admin. Existing Digital Passes saved on participant phones remain valid for visual inspection.
- **Fallback**: Registrations Desk switches to **Manual Offline Registration Log Sheet** (Section 3).
- **Recovery**: Re-sync offline Excel/Google Form entries into Supabase once DB returns online.

---

### Scenario D: Database Connection Exhaustion (HTTP 500 / Too Many Connections)
- **Symptoms**: API returns Postgres error: "FATAL: sorry, too many clients already".
- **First Check**: Check active connections in Supabase Database Health tab.
- **Second Check**: Check if multiple concurrent admin browsers are polling.
- **Immediate Action**: Instruct organizers to close excess Admin browser tabs. Pause auto-refreshing admin tools.
- **Fallback**: Server-side bounded retries (Max 5 attempts) will resolve transient locks; if sustained, toggle Registration Status to `CLOSED` for 2 minutes to drain queue.
- **Recovery**: Connections drain automatically within 10–15 seconds.

---

### Scenario E: Resend / Email Provider Unavailable
- **Symptoms**: Registrations succeed on website, but participants do not receive email receipts.
- **First Check**: Check `/api/status` for `email_queue_health`.
- **Second Check**: Check Resend status page ([https://status.resend.com/](https://status.resend.com/)).
- **Immediate Action**: **DO NOTHING**. Registration insertion is 100% decoupled from email delivery. Registration database writes succeed, and Digital Pass + QR display immediately on screen.
- **Fallback**: Participant saves PNG pass directly from website screen.
- **Recovery**: Outbox logs in `public.email_outbox` allow automated bulk resend after event using Resend API once restored.

---

### Scenario F: Vercel Deployment Problem / Broken Build
- **Symptoms**: JavaScript console errors or blank screens after a new deployment.
- **First Check**: Run `npx vercel list` to view deployment history.
- **Second Check**: Test previous deployment URL.
- **Immediate Action**: Perform instant Vercel rollback:
  ```bash
  npx vercel promote <previous-known-good-deployment-id>
  ```
- **Fallback**: Rollback completes in <10 seconds without downtime.
- **Recovery**: Investigate build logs locally, fix issue, and redeploy.

---

### Scenario G: DNS / Domain Resolution Failure
- **Symptoms**: Domain `exousia-vert.vercel.app` fails to resolve.
- **First Check**: Test direct Vercel deployment URL (`https://exousia-*.vercel.app`).
- **Second Check**: Test public IP / DNS resolution using `nslookup`.
- **Immediate Action**: Broadcast backup `.vercel.app` URL to coordinator WhatsApp group.
- **Recovery**: Update DNS record or Vercel domain alias settings.

---

### Scenario H: Campus Internet / Wi-Fi Outage
- **Symptoms**: Coordinators on campus Wi-Fi cannot access verification portal.
- **First Check**: Switch coordinator mobile phone from campus Wi-Fi to 4G/5G Cellular Data.
- **Second Check**: Test native camera / Google Lens scanning over 5G.
- **Immediate Action**: Coordinators use personal 4G/5G hotspots for entry verification.
- **Fallback**: Offline Physical Ticket / Log Sheet checking.

---

### Scenario I: Admin Dashboard Unavailable / Auth Failure
- **Symptoms**: Admin login shows "UNAUTHORIZED ACCESS" or 401 response.
- **First Check**: Verify `ADMIN_SECRET_KEY` in Vercel project environment variables.
- **Second Check**: Ensure key entered matches environment variable exactly (case-sensitive, no spaces).
- **Immediate Action**: Clear browser `sessionStorage`, re-enter `ADMIN_SECRET_KEY`.
- **Recovery**: Re-deploy Vercel environment if environment key was rotated.

---

### Scenario J: Registration Duplicate Reports
- **Symptoms**: Participant claims they registered twice or received duplicate ID.
- **First Check**: Open Admin Dashboard (`/admin`), search participant email.
- **Second Check**: Verify `idempotency_key` and registration timestamps.
- **Immediate Action**: If duplicates exist, retain the earliest confirmed `EX-2026-XXXXXX` ID and inform participant.

---

### Scenario K: QR Verification Failure at Entrance Desk
- **Symptoms**: Coordinator phone camera fails to read QR or shows camera permission error.
- **First Check**: Tap **[ ENTER REGISTRATION ID MANUALLY ]** on `/verify` page.
- **Second Check**: Enter `EX-2026-XXXXXX` ID into manual text field.
- **Immediate Action**: Instant manual database lookup resolves entry authorization without camera.

---

### Scenario L: Full Cloud Outage (Vercel + Supabase Down Simultaneously)
- **Symptoms**: Total web unavailability across all devices.
- **First Check**: Confirm outage across multiple networks.
- **Immediate Action**: Switch entry gate to **Physical Paper Log Sheet & Manual Verification** (Section 3).

---

## 3. MANUAL OFFLINE REGISTRATION LOG SHEET PROCEDURE

When electronic registration is completely disabled, use paper log sheets or an offline spreadsheet with the following required columns:

| Field # | Column Header | Example Entry | Required |
| :--- | :--- | :--- | :--- |
| **1** | Timestamp | `2026-09-30 09:45 AM` | YES |
| **2** | Full Name | `K. Sai Teja` | YES |
| **3** | Phone / WhatsApp | `98480 12345` | YES |
| **4** | Email Address | `saiteja@vvit.net` | YES |
| **5** | Institution / College | `VVIT University` | YES |
| **6** | Department | `EEE` | YES |
| **7** | Year | `3rd Year` | YES |
| **8** | Event Selected | `GENOVA` | YES |
| **9** | Team Name / Size | `Single Player` | YES |
| **10** | Temp ID Issued | `TEMP-001` | YES |
| **11** | Coordinator Signature | `Lahari` | YES |
