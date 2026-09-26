// Vercel Serverless API Function — EXOUSIA Participant Feedback Submission Endpoint
// Route: POST /api/feedback
// Features: Day-wise feedback, 1-5 rating, unique constraint (registration_id, day) duplicate prevention.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method Not Allowed. Use POST.'
    });
  }

  try {
    const { registration_id, day, rating, liked, disliked, suggestions } = req.body || {};

    const sanitizedRegId = (registration_id || '').trim().toUpperCase();
    const sanitizedDay = (day || 'day1').trim().toLowerCase();
    const parsedRating = parseInt(rating, 10);
    const sanitizedLiked = (liked || '').trim().slice(0, 1000);
    const sanitizedDisliked = (disliked || '').trim().slice(0, 1000);
    const sanitizedSuggestions = (suggestions || '').trim().slice(0, 1000);

    // Validation
    if (!sanitizedRegId || sanitizedRegId.length < 5) {
      return res.status(422).json({
        success: false,
        code: 'INVALID_REGISTRATION_ID',
        message: 'Please provide a valid EXOUSIA Registration ID (e.g. EX-2026-XXXXXX).'
      });
    }

    if (!['day1', 'day2'].includes(sanitizedDay)) {
      return res.status(422).json({
        success: false,
        code: 'INVALID_DAY',
        message: 'Invalid day specified. Must be day1 or day2.'
      });
    }

    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(422).json({
        success: false,
        code: 'INVALID_RATING',
        message: 'Please provide a rating score between 1 and 5 stars.'
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(503).json({
        success: false,
        code: 'DATABASE_UNCONFIGURED',
        message: 'Feedback database service is currently unconfigured.'
      });
    }

    // 1. Verify Registration Existence
    const verifyRegRes = await fetch(`${supabaseUrl}/rest/v1/registrations?confirmation_code=eq.${encodeURIComponent(sanitizedRegId)}&select=id,confirmation_code,primary_name`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (verifyRegRes.ok) {
      const rows = await verifyRegRes.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(404).json({
          success: false,
          code: 'REGISTRATION_NOT_FOUND',
          message: `Registration ID ${sanitizedRegId} was not found in EXOUSIA database.`
        });
      }
    }

    // 2. Duplicate Check for (registration_id, day)
    const dupCheckRes = await fetch(
      `${supabaseUrl}/rest/v1/feedback_responses?registration_id=eq.${encodeURIComponent(sanitizedRegId)}&day=eq.${encodeURIComponent(sanitizedDay)}&select=id`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    if (dupCheckRes.ok) {
      const existing = await dupCheckRes.json();
      if (Array.isArray(existing) && existing.length > 0) {
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_FEEDBACK',
          message: `Feedback for ${sanitizedDay.toUpperCase()} has already been submitted for Registration ID ${sanitizedRegId}.`
        });
      }
    }

    // 3. Insert Feedback Record
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/feedback_responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        registration_id: sanitizedRegId,
        day: sanitizedDay,
        rating: parsedRating,
        liked: sanitizedLiked,
        disliked: sanitizedDisliked,
        suggestions: sanitizedSuggestions,
        created_at: new Date().toISOString()
      })
    });

    if (insertRes.status === 409) {
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_FEEDBACK',
        message: `Feedback for ${sanitizedDay.toUpperCase()} has already been recorded.`
      });
    }

    if (!insertRes.ok) {
      const errTxt = await insertRes.text();
      console.error('Feedback insertion error:', errTxt);
      return res.status(500).json({
        success: false,
        code: 'DATABASE_INSERT_ERROR',
        message: 'Failed to record feedback response.'
      });
    }

    return res.status(201).json({
      success: true,
      message: `Thank you! Your feedback for ${sanitizedDay.toUpperCase()} has been submitted successfully.`
    });

  } catch (error) {
    console.error('Feedback API Error:', error);
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Server error processing feedback submission.'
    });
  }
}
