# EXOUSIA 2026 — EEE Department Prestige Symposium Backend

This is the production-ready Next.js App Router project for **EXOUSIA**, the state-level EEE technical festival. It integrates a secure, relational database backend driven by Supabase.

---

## 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Supabase**: Active PostgreSQL project instances

---

## 2. Environment Variables

To configure database connections locally, create a `.env.local` file at the root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional Cloudflare Turnstile bot verification (Server-only key)
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

*Security Alert: `SUPABASE_SERVICE_ROLE_KEY` and `TURNSTILE_SECRET_KEY` are highly privileged. They must **never** be prefixed with `NEXT_PUBLIC_` or imported in browser/client components. They are strictly limited to server-side code.*

---

## 3. Local Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Apply Database Schema**:
   Copy the contents of the SQL migration scripts in `supabase/migrations/` and run them inside your Supabase SQL Editor:
   - [`20260815000000_init_schema.sql`](file:///C:/Users/Lenovo/.gemini/antigravity/scratch/exousia/supabase/migrations/20260815000000_init_schema.sql)
   - [`20260815000001_harden_registration.sql`](file:///C:/Users/Lenovo/.gemini/antigravity/scratch/exousia/supabase/migrations/20260815000001_harden_registration.sql)
   - [`20260815000002_email_outbox.sql`](file:///C:/Users/Lenovo/.gemini/antigravity/scratch/exousia/supabase/migrations/20260815000002_email_outbox.sql)
3. **Seed Database**:
   Copy the SQL insertion statements in [`supabase/seed.sql`](file:///C:/Users/Lenovo/.gemini/antigravity/scratch/exousia/supabase/seed.sql) and run it inside the Supabase SQL Editor to populate lab blocks and events.
4. **Boot Development Environment**:
   ```bash
   npm run dev
   ```

---

## 4. Production Deployment

When deploying to Vercel/Next.js hosting platforms:
1. Link your repository.
2. In the project dashboard, configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TURNSTILE_SECRET_KEY` (Optional, to enable bot protection validation checks)
3. Execute build:
   ```bash
   npm run build
   ```
   *Note: During build compilation (`next build`), the data-access layer detects the compilation phase (`process.env.NEXT_PHASE === 'phase-production-build'`) and uses mock fallbacks if environment variables are not loaded, ensuring successful build compilation. At server runtime, if keys are missing in production, it throws loud errors.*

---

## 5. Security, Email Outbox & Bot Protection Design

- **Row Level Security (RLS)**: Public tables allow SELECT read-only queries for published entries. Direct REST insert/write calls are disabled globally.
- **Server Action Validation**: The server re-validates incoming form values via Zod schemas, fetches the event constraints server-side, and generates a deterministic idempotency hash (`idemp_${email}_${phone}_${eventSlug}`).
- **Atomic Slot Lock**: Database RPC locks event rows at transaction time via `SELECT FOR UPDATE` to block parallel over-capacitation.
- **Email Notifications Outbox**: Database-level triggers automatically insert a pending email receipt record into the `public.email_outbox` table during successful transactions. This is database-transaction safe and ready to be processed by a cron scheduler background worker.
- **Turnstile Verification**: If `TURNSTILE_SECRET_KEY` is present in production environments, the Server Action intercepts submissions and verifies the browser tokens against Cloudflare's validation endpoint before writing to the database.
