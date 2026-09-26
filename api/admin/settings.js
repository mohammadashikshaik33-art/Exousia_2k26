// Vercel Serverless API Function — EXOUSIA Admin System Control Endpoint
// Route: GET /api/admin/settings, POST /api/admin/settings
// Security: Strictly requires valid ADMIN_SECRET_KEY Authorization header. Allows toggling Website Status (ONLINE/MAINTENANCE), Registration Status (OPEN/CLOSED), Emergency Mode (ENABLED/DISABLED), and updating Emergency Registration URL.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version, Authorization, X-Admin-Secret'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const adminSecret = process.env.ADMIN_SECRET_KEY;
    if (!adminSecret) {
      return res.status(503).json({
        success: false,
        code: 'ADMIN_UNCONFIGURED',
        message: 'ADMIN_SECRET_KEY is not configured on the server.'
      });
    }

    const rawAuth = req.headers.authorization || req.headers['x-admin-secret'] || req.query.secret || '';
    const providedToken = String(rawAuth).replace(/^Bearer\s+/i, '').trim();

    if (!providedToken || providedToken !== adminSecret) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Access denied. Valid admin authorization secret required.'
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(503).json({
        success: false,
        code: 'DATABASE_UNCONFIGURED',
        message: 'Database service is unconfigured.'
      });
    }

    if (req.method === 'GET') {
      const dbRes = await fetch(`${supabaseUrl}/rest/v1/festival_editions?select=registration_status,theme&limit=1`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      let websiteStatus = 'ONLINE';
      let registrationStatus = 'OPEN';
      let emergencyMode = 'DISABLED';
      let emergencyUrl = '';

      if (dbRes.ok) {
        const rows = await dbRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const fest = rows[0];
          if (fest.registration_status) {
            const regStatus = String(fest.registration_status).trim().toLowerCase();
            if (regStatus === 'closed') {
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
      }

      return res.status(200).json({
        success: true,
        website_status: websiteStatus,
        registration_status: registrationStatus,
        emergency_mode: emergencyMode,
        emergency_url: emergencyUrl
      });
    }

    if (req.method === 'POST') {
      const { website_status, registration_status, emergency_mode, emergency_url } = req.body || {};

      // Retrieve current record first
      const getRes = await fetch(`${supabaseUrl}/rest/v1/festival_editions?select=registration_status,theme&limit=1`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      let currentTheme = 'Stranger Things';
      let currentRegStatus = 'open';

      if (getRes.ok) {
        const rows = await getRes.json();
        if (rows[0]) {
          currentTheme = rows[0].theme || 'Stranger Things';
          currentRegStatus = rows[0].registration_status || 'open';
        }
      }

      let newWeb = website_status ? String(website_status).trim().toUpperCase() : (currentTheme.includes('MAINTENANCE') ? 'MAINTENANCE' : 'ONLINE');
      let newReg = registration_status ? String(registration_status).trim().toUpperCase() : (currentRegStatus === 'closed' ? 'CLOSED' : 'OPEN');
      let newEmerg = emergency_mode ? String(emergency_mode).trim().toUpperCase() : (currentTheme.includes('EMERGENCY') ? 'ENABLED' : 'DISABLED');
      let newEmergUrl = emergency_url !== undefined ? String(emergency_url).trim() : (currentTheme.includes('EMERGENCY_URL=') ? currentTheme.split('EMERGENCY_URL=')[1].split(';')[0].trim() : '');

      let themeParts = ['Stranger Things'];
      if (newWeb === 'MAINTENANCE') themeParts.push('MAINTENANCE');
      if (newEmerg === 'ENABLED') themeParts.push('EMERGENCY');
      if (newEmergUrl) themeParts.push(`EMERGENCY_URL=${newEmergUrl};`);

      const patchPayload = {
        theme: themeParts.join(' — '),
        registration_status: newEmerg === 'ENABLED' ? 'emergency' : (newReg === 'CLOSED' ? 'closed' : 'open'),
        updated_at: new Date().toISOString()
      };

      const patchRes = await fetch(`${supabaseUrl}/rest/v1/festival_editions?id=eq.e1801f5e-1a22-4a0b-8d07-8e6dfd158700`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(patchPayload)
      });

      if (!patchRes.ok) {
        const errText = await patchRes.text();
        console.error('Failed to update system settings in DB:', errText);
        return res.status(500).json({
          success: false,
          code: 'UPDATE_FAILED',
          message: 'Failed to save system settings to database.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'System control settings updated successfully.',
        website_status: newWeb,
        registration_status: newReg,
        emergency_mode: newEmerg,
        emergency_url: newEmergUrl
      });
    }

    return res.status(405).json({
      success: false,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method Not Allowed.'
    });

  } catch (error) {
    console.error('Admin Settings API Error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred.'
    });
  }
}
