// Vercel Serverless API Function — EXOUSIA Organizer Admin Registrations Endpoint
// Route: GET /api/admin/registrations
// Security: Strictly requires valid ADMIN_SECRET_KEY Authorization header, server-side Supabase queries, allowlisted query params, pagination, and zero PII leaks to unauthorized callers.
// IMPORTANT: SUPABASE_SERVICE_ROLE_KEY is NEVER accepted as an admin authorization credential.

export default async function handler(req, res) {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version, Authorization, X-Admin-Secret'
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
    // 1. Strict Authorization Verification
    // Requirement: ADMIN_SECRET_KEY is the ONLY credential accepted for organizer dashboard authorization.
    // SUPABASE_SERVICE_ROLE_KEY must NEVER be accepted as an admin login credential.
    const adminSecret = process.env.ADMIN_SECRET_KEY;

    if (!adminSecret) {
      // Server environment unconfigured for admin authorization
      return res.status(503).json({
        success: false,
        code: 'ADMIN_UNCONFIGURED',
        message: 'Admin authorization service is unconfigured. ADMIN_SECRET_KEY environment variable is required on the server.'
      });
    }

    const rawAuth = req.headers.authorization || req.headers['x-admin-secret'] || req.query.secret || req.query.adminSecret || req.query.key || '';
    const providedToken = String(rawAuth).replace(/^Bearer\s+/i, '').trim();

    if (!providedToken || providedToken !== adminSecret) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Access denied. Valid admin authorization secret required.'
      });
    }

    // 2. Supabase Canonical Environment Variable Check
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(503).json({
        success: false,
        code: 'DATABASE_UNCONFIGURED',
        message: 'Registration database service is currently unconfigured. Please notify event administrators.'
      });
    }

    // 3. Query Parameter Parsing & Server-Side Input Validation
    const { id, search, event, status, sort, page: reqPage, pageSize: reqPageSize } = req.query || {};

    // Single Record Lookup Handler
    // Single Record Lookup Handler
    if (id) {
      const sanitizedId = String(id).trim().toUpperCase();
      const encodedId = encodeURIComponent(sanitizedId);
      const detailResponse = await fetch(`${supabaseUrl}/rest/v1/registrations?confirmation_code=eq.${encodedId}`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Accept': 'application/json'
        }
      });

      if (!detailResponse.ok) {
        const errText = await detailResponse.text();
        console.error('Database detail query error:', errText);
        return res.status(500).json({
          success: false,
          code: 'DATABASE_QUERY_ERROR',
          message: 'Failed to retrieve participant detail record.'
        });
      }

      const detailData = await detailResponse.json();
      if (!Array.isArray(detailData) || detailData.length === 0) {
        return res.status(404).json({
          success: false,
          code: 'REGISTRATION_NOT_FOUND',
          message: `No registration found matching ID ${sanitizedId}.`
        });
      }

      const rawRec = detailData[0];
      const normalizedRecord = {
        ...rawRec,
        registration_id: rawRec.confirmation_code || rawRec.id,
        full_name: rawRec.primary_name || 'Participant',
        email: rawRec.primary_email || '',
        phone: rawRec.primary_phone || '',
        college: rawRec.primary_college || '',
        selected_event: rawRec.team_name || rawRec.registration_kind || '',
        status: (rawRec.status || 'confirmed').toUpperCase()
      };

      return res.status(200).json({
        success: true,
        record: normalizedRecord
      });
    }

    // Paginated List Query Handler
    const page = Math.max(1, parseInt(reqPage, 10) || 1);
    const ALLOWED_PAGE_SIZES = [25, 50, 100];
    const parsedPageSize = parseInt(reqPageSize, 10) || 25;
    const pageSize = ALLOWED_PAGE_SIZES.includes(parsedPageSize) ? parsedPageSize : 25;
    const offset = (page - 1) * pageSize;

    const ALLOWED_EVENTS = [
      'ALL',
      'CLUE\'D UP',
      'HAWKINS TRAP',
      'DARK PROTOCOL',
      'DARK PORTAL',
      'GENOVA',
      'NEXORA'
    ];

    const ALLOWED_STATUSES = ['ALL', 'REGISTERED', 'CONFIRMED'];

    const ALLOWED_SORTS = {
      newest: 'created_at.desc',
      oldest: 'created_at.asc'
    };

    const selectedEvent = (event || 'ALL').trim().toUpperCase();
    const selectedSortKey = (sort || 'newest').trim().toLowerCase();
    const orderQuery = ALLOWED_SORTS[selectedSortKey] || ALLOWED_SORTS.newest;

    const queryParams = new URLSearchParams();
    queryParams.set('order', orderQuery);
    queryParams.set('limit', String(pageSize));
    queryParams.set('offset', String(offset));

    if (ALLOWED_EVENTS.includes(selectedEvent) && selectedEvent !== 'ALL') {
      if (selectedEvent === 'GENOVA' || selectedEvent === 'NEXORA') {
        queryParams.set('or', '(team_name.ilike.*GENOVA*,team_name.ilike.*NEXORA*)');
      } else {
        queryParams.set('team_name', `ilike.*${encodeURIComponent(selectedEvent)}*`);
      }
    }

    if (search && typeof search === 'string') {
      const cleanSearch = search.trim().slice(0, 80).replace(/[\*\%\(\)\,\.\:\\\/]/g, '');
      if (cleanSearch.length > 0) {
        const pattern = `*${cleanSearch}*`;
        queryParams.set(
          'or',
          `(confirmation_code.ilike.${pattern},primary_name.ilike.${pattern},primary_email.ilike.${pattern},primary_college.ilike.${pattern},team_name.ilike.${pattern})`
        );
      }
    }

    const dbResponse = await fetch(`${supabaseUrl}/rest/v1/registrations?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Accept': 'application/json',
        'Prefer': 'count=exact'
      }
    });

    if (!dbResponse.ok) {
      const dbErrText = await dbResponse.text();
      console.error('Database query error:', dbErrText);
      return res.status(500).json({
        success: false,
        code: 'DATABASE_QUERY_ERROR',
        message: 'Failed to retrieve registrations from database.'
      });
    }

    const rawRecords = await dbResponse.json();

    const records = (Array.isArray(rawRecords) ? rawRecords : []).map(rec => ({
      ...rec,
      registration_id: rec.confirmation_code || rec.registration_id || rec.id,
      full_name: rec.primary_name || rec.full_name || 'Participant',
      email: rec.primary_email || rec.email || '',
      phone: rec.primary_phone || rec.phone || '',
      college: rec.primary_college || rec.college || '',
      selected_event: rec.team_name || rec.registration_kind || rec.selected_event || '',
      status: (rec.status || 'confirmed').toUpperCase()
    }));

    const contentRange = dbResponse.headers.get('content-range') || '';
    let total = 0;
    if (contentRange.includes('/')) {
      const totalStr = contentRange.split('/')[1];
      total = parseInt(totalStr, 10) || 0;
    } else {
      total = records.length;
    }

    const totalPages = Math.ceil(total / pageSize) || (records.length > 0 ? 1 : 0);

    let metrics = {
      totalRegistrations: total,
      byEvent: {
        'CLUE\'D UP': 0,
        'HAWKINS TRAP': 0,
        'DARK PROTOCOL': 0,
        'GENOVA': 0,
        'NEXORA': 0
      }
    };

    const metricsResponse = await fetch(`${supabaseUrl}/rest/v1/registrations?select=team_name,registration_kind`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Accept': 'application/json'
      }
    });

    if (metricsResponse.ok) {
      const allEventsData = await metricsResponse.json();
      if (Array.isArray(allEventsData)) {
        metrics.totalRegistrations = allEventsData.length;
        allEventsData.forEach(row => {
          const track = (row.team_name || row.registration_kind || '').toUpperCase();
          if (track.includes('CLUE\'D UP')) metrics.byEvent['CLUE\'D UP']++;
          if (track.includes('HAWKINS TRAP')) metrics.byEvent['HAWKINS TRAP']++;
          if (track.includes('DARK PROTOCOL')) metrics.byEvent['DARK PROTOCOL']++;
          if (track.includes('GENOVA') || track.includes('NEXORA')) {
            metrics.byEvent['GENOVA']++;
            metrics.byEvent['NEXORA']++;
          }
        });
      }
    }

    return res.status(200).json({
      success: true,
      records,
      page,
      pageSize,
      total,
      totalPages,
      metrics
    });

  } catch (error) {
    console.error('Admin API Function Error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred while retrieving admin registrations.'
    });
  }
}
