// Vercel Serverless API Function — EXOUSIA Participant Feedback Submission Endpoint
// Route: POST /api/feedback
// Features: Day-wise feedback, 1-5 rating, day-specific options, fallback storage resilience.

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
    const {
      registration_id,
      day,
      rating,
      liked,
      disliked,
      suggestions,
      selected_event,
      memorable_moment,
      future_attendance
    } = req.body || {};

    const sanitizedRegId = (registration_id || '').trim().toUpperCase();
    const sanitizedDay = (day || 'day1').trim().toLowerCase();
    const parsedRating = parseInt(rating, 10);
    const sanitizedLiked = (liked || '').trim().slice(0, 1000);
    const sanitizedDisliked = (disliked || '').trim().slice(0, 1000);
    const sanitizedSuggestions = (suggestions || '').trim().slice(0, 1000);
    const sanitizedEvent = (selected_event || '').trim().slice(0, 200);
    const sanitizedMemorable = (memorable_moment || '').trim().slice(0, 500);
    const sanitizedFuture = (future_attendance || '').trim().slice(0, 100);

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
    const verifyRegRes = await fetch(
      `${supabaseUrl}/rest/v1/registrations?confirmation_code=eq.${encodeURIComponent(sanitizedRegId)}&select=id,confirmation_code,primary_name,team_name`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

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

    // 2. Duplicate Check for (registration_id, day) in email_outbox / feedback_responses
    const outboxDupCheck = await fetch(
      `${supabaseUrl}/rest/v1/email_outbox?recipient=eq.FEEDBACK_RESPONSE&subject=eq.FEEDBACK_${sanitizedDay.toUpperCase()}_${encodeURIComponent(sanitizedRegId)}&select=id`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    );

    if (outboxDupCheck.ok) {
      const existingOutbox = await outboxDupCheck.json();
      if (Array.isArray(existingOutbox) && existingOutbox.length > 0) {
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_FEEDBACK',
          message: `Feedback for ${sanitizedDay.toUpperCase()} has already been submitted for Registration ID ${sanitizedRegId}.`
        });
      }
    }

    // Combine Day-Specific Info into formatted text block for persistence
    const fullFeedbackData = {
      registration_id: sanitizedRegId,
      day: sanitizedDay,
      rating: parsedRating,
      selected_event: sanitizedEvent,
      memorable_moment: sanitizedMemorable,
      future_attendance: sanitizedFuture,
      liked: sanitizedLiked,
      disliked: sanitizedDisliked,
      suggestions: sanitizedSuggestions,
      submitted_at: new Date().toISOString()
    };

    // Try inserting into feedback_responses if table exists
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

    // Always log full structured feedback record into email_outbox as resilient log
    await fetch(`${supabaseUrl}/rest/v1/email_outbox`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        recipient: 'FEEDBACK_RESPONSE',
        subject: `FEEDBACK_${sanitizedDay.toUpperCase()}_${sanitizedRegId}`,
        body: JSON.stringify(fullFeedbackData),
        status: 'received',
        sent_at: new Date().toISOString()
      })
    }).catch((e) => console.warn('Outbox feedback logging notice:', e));

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
