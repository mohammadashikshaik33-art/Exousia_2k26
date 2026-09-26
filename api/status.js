// Vercel Serverless API Function — EXOUSIA Public Status & Operational Health Endpoint
// Route: GET /api/status
// Purpose: Returns public system availability, registration status, emergency registration mode, and safe operational health indicators. Zero secret exposure.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method Not Allowed. Use GET.'
    });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    let websiteStatus = 'ONLINE';
    let registrationStatus = 'OPEN';
    let emergencyMode = 'DISABLED';
    let emergencyUrl = '';
    let dbHealth = 'UNAVAILABLE';
    const hasGmailCreds = Boolean(
      (process.env.GOOGLE_CLIENT_ID || process.env.google_client_id) &&
      (process.env.GOOGLE_CLIENT_SECRET || process.env.google_client_secret) &&
      (process.env.google_refresh_token || process.env.GOOGLE_REFRESH_TOKEN)
    );
    let emailHealth = hasGmailCreds ? 'HEALTHY' : (process.env.RESEND_API_KEY ? 'HEALTHY' : 'UNCONFIGURED');

    if (supabaseUrl && supabaseKey) {
      const dbStart = Date.now();
      try {
        const dbRes = await fetch(`${supabaseUrl}/rest/v1/festival_editions?select=registration_status,theme,timezone&limit=1`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });

        if (dbRes.ok) {
          const dbElapsed = Date.now() - dbStart;
          dbHealth = dbElapsed > 3000 ? 'DEGRADED' : 'HEALTHY';

          const rows = await dbRes.json();
          if (Array.isArray(rows) && rows.length > 0) {
            const fest = rows[0];
            if (fest.registration_status) {
              const regStatus = String(fest.registration_status).trim().toLowerCase();
              if (regStatus === 'closed') {
                registrationStatus = 'CLOSED';
              } else if (regStatus === 'maintenance') {
                websiteStatus = 'MAINTENANCE';
                registrationStatus = 'CLOSED';
              } else if (regStatus === 'emergency') {
                emergencyMode = 'ENABLED';
                registrationStatus = 'CLOSED';
              } else {
                registrationStatus = 'OPEN';
              }
            }

            if (fest.theme) {
              const themeStr = String(fest.theme);
              if (themeStr.toUpperCase().includes('MAINTENANCE')) {
                websiteStatus = 'MAINTENANCE';
              }
              if (themeStr.toUpperCase().includes('EMERGENCY')) {
                emergencyMode = 'ENABLED';
              }
              if (themeStr.includes('EMERGENCY_URL=')) {
                emergencyUrl = themeStr.split('EMERGENCY_URL=')[1].split(';')[0].trim();
              }
            }
          }
        } else {
          dbHealth = 'DEGRADED';
        }
      } catch (dbErr) {
        console.warn('Database health check ping failed:', dbErr);
        dbHealth = 'UNAVAILABLE';
      }
    }

    return res.status(200).json({
      success: true,
      website_status: websiteStatus,
      registration_status: registrationStatus,
      emergency_mode: emergencyMode,
      emergency_url: emergencyUrl || null,
      database_health: dbHealth,
      email_queue_health: emailHealth,
      festival_name: 'EXOUSIA 2026',
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Status API Error:', err);
    return res.status(200).json({
      success: true,
      website_status: 'ONLINE',
      registration_status: 'OPEN',
      emergency_mode: 'DISABLED',
      database_health: 'UNKNOWN',
      email_queue_health: 'UNKNOWN',
      festival_name: 'EXOUSIA 2026',
      fallback: true
    });
  }
}
