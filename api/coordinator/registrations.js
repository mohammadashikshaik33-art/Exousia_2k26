// Vercel Serverless API Function — EXOUSIA Event Coordinator Endpoint
// Route: GET /api/coordinator/registrations
// Security & Data Policy: Strictly enforced server-side event authorization.
// CRITICAL PRIVACY DIRECTIVE: Zero phone numbers returned in API payloads under any circumstances.

function normalizeEventTrack(input) {
  if (!input) return "CLUE'D UP";
  const s = String(input).trim().toUpperCase();
  if (s.includes('CLUE')) return "CLUE'D UP";
  if (s.includes('HAWKINS')) return "HAWKINS TRAP";
  if (s === 'DARK PORTAL' || s === 'DARK-PORTAL' || s.includes('PORTAL')) return "DARK PORTAL";
  if (s.includes('DARK')) return "DARK PROTOCOL";
  if (s.includes('GENOVA') || s.includes('NEXORA')) return "GENOVA";
  return s;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version, Authorization, X-Coordinator-Secret'
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
    const { event, search, page: reqPage, pageSize: reqPageSize } = req.query || {};

    const ALLOWED_COORDINATOR_EVENTS = [
      "CLUE'D UP",
      "HAWKINS TRAP",
      "DARK PROTOCOL",
      "DARK PORTAL",
      "GENOVA"
    ];

    const requestedEvent = normalizeEventTrack(event);

    if (!ALLOWED_COORDINATOR_EVENTS.includes(requestedEvent)) {
      return res.status(422).json({
        success: false,
        code: 'INVALID_EVENT_SCOPE',
        message: 'Invalid event track requested.'
      });
    }

    // 1. Server-Side Authentication & Event Authorization Check
    const rawAuth = req.headers.authorization || req.headers['x-coordinator-secret'] || req.query.secret || req.query.key || '';
    const providedToken = String(rawAuth).replace(/^Bearer\s+/i, '').trim();

    if (!providedToken) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Authentication token required to access coordinator registrations.'
      });
    }

    // Secret Key Mappings
    const adminSecret = process.env.ADMIN_SECRET_KEY || 'EXOUSIA_SECURE_ADMIN_KEY_998877665544332211_PROD';
    const eventSecretMap = {
      "CLUE'D UP": process.env.COORDINATOR_KEY_CLUEDUP || 'COORD-CLUEDUP-2026',
      "HAWKINS TRAP": process.env.COORDINATOR_KEY_HAWKINS || 'COORD-HAWKINS-2026',
      "DARK PROTOCOL": process.env.COORDINATOR_KEY_DARKPROTOCOL || 'COORD-DARKPROTOCOL-2026',
      "DARK PORTAL": process.env.COORDINATOR_KEY_DARKPORTAL || process.env.COORDINATOR_KEY_DARKPROTOCOL || 'COORD-DARKPORTAL-2026',
      "GENOVA": process.env.COORDINATOR_KEY_GENOVA || 'COORD-GENOVA-2026'
    };

    let isAuthorizedForRequestedEvent = false;

    // Admin key grants access to any event
    if (adminSecret && providedToken === adminSecret) {
      isAuthorizedForRequestedEvent = true;
    } else {
      // Check if provided token matches the requested event's assigned key or alias
      const expectedKey = eventSecretMap[requestedEvent];
      if (expectedKey && providedToken === expectedKey) {
        isAuthorizedForRequestedEvent = true;
      } else if (
        (requestedEvent === 'DARK PORTAL' || requestedEvent === 'DARK PROTOCOL') &&
        (providedToken === 'COORD-DARKPROTOCOL-2026' || providedToken === 'COORD-DARKPORTAL-2026')
      ) {
        isAuthorizedForRequestedEvent = true;
      }
    }

    if (!isAuthorizedForRequestedEvent) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_EVENT_ACCESS',
        message: `Your coordinator credentials are not authorized to access ${requestedEvent} registrations.`
      });
    }

    // 2. Database Connection & Query Execution
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(503).json({
        success: false,
        code: 'DATABASE_UNCONFIGURED',
        message: 'Database connection service unconfigured.'
      });
    }

    const page = Math.max(1, parseInt(reqPage, 10) || 1);
    const pageSize = 50;
    const offset = (page - 1) * pageSize;

    const queryParts = [
      'select=id,confirmation_code,primary_name,primary_email,primary_college,team_name,created_at,status',
      'status=eq.confirmed',
      'team_name=neq.EMAIL_VERIFICATION',
      'order=created_at.desc',
      `limit=${pageSize}`,
      `offset=${offset}`
    ];

    let eventCond = '';
    if (requestedEvent === 'GENOVA' || requestedEvent === 'NEXORA') {
      eventCond = 'or(team_name.ilike.*GENOVA*,team_name.ilike.*NEXORA*)';
    } else if (requestedEvent === 'DARK PROTOCOL' || requestedEvent === 'DARK PORTAL') {
      eventCond = 'or(team_name.ilike.*DARK PROTOCOL*,team_name.ilike.*DARK PORTAL*)';
    } else if (requestedEvent === "CLUE'D UP") {
      eventCond = 'team_name.ilike.*CLUE*D*UP*';
    } else {
      eventCond = `team_name.ilike.*${encodeURIComponent(requestedEvent)}*`;
    }

    const cleanSearch = (search && typeof search === 'string')
      ? search.trim().slice(0, 80).replace(/[\*\%\(\)\,\.\:\\\/]/g, '')
      : '';

    if (cleanSearch.length > 0) {
      const pattern = `*${cleanSearch}*`;
      const searchCond = `or(confirmation_code.ilike.${pattern},primary_name.ilike.${pattern},primary_email.ilike.${pattern},primary_college.ilike.${pattern})`;
      queryParts.push(`and=(${eventCond},${searchCond})`);
    } else {
      queryParts.push(eventCond);
    }

    const dbResponse = await fetch(`${supabaseUrl}/rest/v1/registrations?${queryParts.join('&')}`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Accept': 'application/json',
        'Prefer': 'count=exact'
      }
    });

    if (!dbResponse.ok) {
      const errTxt = await dbResponse.text();
      console.error('Coordinator query error:', errTxt);
      return res.status(500).json({
        success: false,
        code: 'DATABASE_QUERY_ERROR',
        message: 'Failed to retrieve coordinator registrations.'
      });
    }

    const rawRecords = await dbResponse.json();

    // STRICT TRANSFORM: Explicitly map allowed fields ONLY (Zero phone field leak)
    const records = (Array.isArray(rawRecords) ? rawRecords : []).map(rec => ({
      registration_id: rec.confirmation_code || rec.id,
      full_name: rec.primary_name || 'Participant',
      email: rec.primary_email || '',
      college: rec.primary_college || '',
      selected_event: rec.team_name || requestedEvent,
      created_at: rec.created_at || '',
      status: (rec.status || 'confirmed').toUpperCase()
    }));

    const contentRange = dbResponse.headers.get('content-range') || '';
    let totalCount = 0;
    if (contentRange.includes('/')) {
      totalCount = parseInt(contentRange.split('/')[1], 10) || 0;
    } else {
      totalCount = records.length;
    }

    return res.status(200).json({
      success: true,
      event: requestedEvent,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize) || (records.length > 0 ? 1 : 0),
      records
    });

  } catch (error) {
    console.error('Coordinator API Error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Server error retrieving coordinator records.'
    });
  }
}
