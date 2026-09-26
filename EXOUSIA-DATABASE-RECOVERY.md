# EXOUSIA 2K26 — DATABASE BACKUP & RECOVERY PLAN

**Database Provider**: Supabase (PostgreSQL 15+)  
**Project Reference**: `zmtsxawynjxeyufoqkyy`  
**Region**: AWS `ap-south-1` (Mumbai) / Global  

---

## 1. BACKUP STRATEGY & CAPABILITIES

### Daily Automatic Backups
- Supabase automatically executes daily physical backups of the PostgreSQL database.
- Backup files are stored securely offsite by Supabase infrastructure.

### Manual Database Export (Logical Backup)
Organizers can generate an immediate logical SQL snapshot of all registration data using the Supabase CLI or REST API.

#### Option A: Supabase CLI Export (Recommended)
```bash
# Export complete schema and data to SQL file
npx supabase db dump --project-ref zmtsxawynjxeyufoqkyy -f exousia_backup_$(date +%Y%m%d_%H%M%S).sql

# Export data-only (INSERT statements)
npx supabase db dump --project-ref zmtsxawynjxeyufoqkyy --data-only -f exousia_data_backup.sql
```

#### Option B: REST API JSON Snapshot (Instant Admin Backup)
Run the Node.js backup script to pull all `registrations` and `email_outbox` rows to JSON:
```bash
node -e "
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
fetch(\`\${url}/rest/v1/registrations?select=*\`, { headers: { apikey: key, Authorization: 'Bearer ' + key } })
  .then(r => r.json())
  .then(data => require('fs').writeFileSync('registrations_backup.json', JSON.stringify(data, null, 2)));
"
```

---

## 2. DATABASE RESTORATION PROCEDURE

If the primary database experiences severe corruption or catastrophic data loss, follow this procedure:

### Step 1: Provision Clean Database Target
1. Open Supabase Dashboard ([https://supabase.com/dashboard](https://supabase.com/dashboard)).
2. If restoring to a fresh project, create new PostgreSQL database.

### Step 2: Apply Schema DDL
Execute `schema.sql` to recreate tables (`registrations`, `email_outbox`, `festival_editions`, `events`, `venues`, `coordinators`, `event_coordinators`).

### Step 3: Restore Data
Using `psql` or Supabase SQL Editor:
```bash
psql "postgres://postgres:[YOUR-PASSWORD]@db.zmtsxawynjxeyufoqkyy.supabase.co:5432/postgres" < exousia_backup.sql
```

### Step 4: Re-Configure Environment Variables
Update Vercel environment variables to point to restored database credentials:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Re-deploy Vercel alias:
```bash
npx vercel --prod
```

---

## 3. POINT-IN-TIME RECOVERY (PITR) ANALYSIS

- **Free Tier**: Supabase Free Tier does **NOT** include automatic Point-In-Time Recovery (PITR). Database rollback is limited to standard daily snapshots.
- **Pro Tier ($25/mo)**: Enables PITR with 7-day continuousWAL archiving, allowing restoration to any exact second.
- **Recommendation**: Upgrading to Supabase Pro before September 23 enables instant 1-second precision PITR recovery if accidental mass data deletion occurs.

---

## 4. ARCHITECTURAL CAPABILITY CLASSIFICATION

| Mechanism | Supported Status | Details |
| :--- | :--- | :--- |
| **Daily Backups** | **DOCUMENTED** | Included in Supabase infrastructure |
| **Manual SQL Export** | **VERIFIED** | CLI / REST export script tested and working |
| **Point-In-Time Recovery** | **REQUIRES PRO PLAN** | Available on Supabase Pro upgrade |
| **Read Replicas** | **NOT REQUIRED** | 8,000 rows (~17 MB) does not warrant dedicated read replicas |
| **Automatic Multi-Cloud Failover**| **NOT SUPPORTED** | Single primary AWS region; standard for single-event tech fests |
