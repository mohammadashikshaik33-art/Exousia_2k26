// Vercel Serverless API Function — EXOUSIA Verification Foundation Endpoint
// Route: GET /api/verify-registration
// Purpose: Minimal server-side verification of participant credentials by registration ID or QR token payload.
// Security: Minimal public verification response (Privacy boundary: Returns ONLY registration_id, full_name, college, selected_event, status).

export default async function handler(req, res) {
  // CORS & Security Headers
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
    const rawInput = (req.query.id || req.query.payload || '').trim();

    if (!rawInput) {
      return res.status(422).json({
        success: false,
        valid: false,
        code: 'MISSING_IDENTIFIER',
        message: 'Please provide a registration ID or QR token payload.'
      });
    }

    // Safely parse registration ID from raw input or EXOUSIA:<registration_id> QR payload
    let regId = rawInput.toUpperCase();
    if (regId.startsWith('EXOUSIA:')) {
      regId = regId.replace(/^EXOUSIA:/, '').trim();
    }

    // Format Validation: Must match canonical EX-2026-XXXXXX pattern
    const regIdRegex = /^EX-2026-[A-Z0-9]{6}$/;
    if (!regIdRegex.test(regId)) {
      return res.status(422).json({
        success: false,
        valid: false,
        code: 'INVALID_REGISTRATION_ID_FORMAT',
        message: 'Registration ID format must be EX-2026-XXXXXX or EXOUSIA:EX-2026-XXXXXX.'
      });
    }

    // Supabase Canonical Environment Variable Check (Server-side ONLY)
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(503).json({
        success: false,
        valid: false,
        code: 'DATABASE_UNCONFIGURED',
        message: 'Verification database service is currently unconfigured. Please notify event organizers.'
      });
    }

    // Query Supabase for minimal verification columns ONLY (Privacy Boundary)
    const selectFields = 'confirmation_code,primary_name,primary_college,team_name,registration_kind,status,created_at';
    const encodedId = encodeURIComponent(regId);
    const dbResponse = await fetch(
      `${supabaseUrl}/rest/v1/registrations?confirmation_code=eq.${encodedId}&select=${selectFields}`,
      {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!dbResponse.ok) {
      const errText = await dbResponse.text();
      console.error('Database query error during verification:', errText);
      return res.status(500).json({
        success: false,
        valid: false,
        code: 'DATABASE_QUERY_ERROR',
        message: 'An error occurred while verifying the registration record.'
      });
    }

    const records = await dbResponse.json();

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(200).json({
        success: true,
        valid: false,
        code: 'REGISTRATION_NOT_FOUND',
        message: `No registration record found matching identifier ${regId}.`
      });
    }

    const record = records[0];

    // Exclude EMAIL_VERIFICATION placeholder records or non-confirmed registrations
    if (record.team_name === 'EMAIL_VERIFICATION' || (record.status || '').toLowerCase() !== 'confirmed') {
      return res.status(200).json({
        success: true,
        valid: false,
        code: 'REGISTRATION_NOT_CONFIRMED',
        message: 'This registration is not confirmed or is an incomplete verification request.'
      });
    }

    // Minimal verification response (Privacy Boundary Enforcement)
    return res.status(200).json({
      success: true,
      valid: true,
      registration: {
        registration_id: record.confirmation_code || regId,
        full_name: record.primary_name || 'Participant',
        college: record.primary_college || 'Institution',
        selected_event: record.team_name || record.registration_kind || 'Official Event',
        status: (record.status || 'confirmed').toUpperCase(),
        created_at: record.created_at || null
      }
    });

  } catch (error) {
    console.error('Verification Endpoint Error:', error);
    return res.status(500).json({
      success: false,
      valid: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred during verification.'
    });
  }
}
