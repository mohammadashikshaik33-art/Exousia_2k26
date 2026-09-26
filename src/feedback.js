// EXOUSIA 2K26 — Participant Feedback Portal JS
// Purpose: Interactive star rating, day selection, URL token parsing, and API submission.

let selectedRating = 5;
let selectedDay = 'day1';

const RATING_LABELS = {
  1: '1 Star — Needs Major Improvement',
  2: '2 Stars — Below Expectations',
  3: '3 Stars — Average / Satisfactory',
  4: '4 Stars — Good Experience',
  5: '5 Stars — Excellent Experience'
};

function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const regId = params.get('id') || params.get('token') || params.get('reg') || '';
  const dayParam = (params.get('day') || '').toLowerCase();

  const regInput = document.getElementById('fb-reg-id');
  if (regInput && regId) {
    regInput.value = regId.toUpperCase();
  }

  if (['day1', 'day2'].includes(dayParam)) {
    setDay(dayParam);
  } else {
    setDay('day1');
  }
}

function setDay(dayKey) {
  selectedDay = dayKey;
  const dayInput = document.getElementById('fb-day-input');
  const day1Btn = document.getElementById('fb-day1-btn');
  const day2Btn = document.getElementById('fb-day2-btn');

  if (dayInput) dayInput.value = dayKey;

  if (day1Btn && day2Btn) {
    if (dayKey === 'day1') {
      day1Btn.className = 'feedback-day-btn p-3.5 rounded-xl border-2 border-primary bg-primary/20 text-primary font-bold text-center transition-all cursor-pointer shadow-lg';
      day2Btn.className = 'feedback-day-btn p-3.5 rounded-xl border border-outline-variant/40 bg-surface-container/60 text-on-surface-variant font-bold text-center transition-all cursor-pointer';
    } else {
      day2Btn.className = 'feedback-day-btn p-3.5 rounded-xl border-2 border-primary bg-primary/20 text-primary font-bold text-center transition-all cursor-pointer shadow-lg';
      day1Btn.className = 'feedback-day-btn p-3.5 rounded-xl border border-outline-variant/40 bg-surface-container/60 text-on-surface-variant font-bold text-center transition-all cursor-pointer';
    }
  }
}

function setRating(val) {
  selectedRating = Math.max(1, Math.min(5, val));
  const ratingInput = document.getElementById('fb-rating-input');
  const starLabel = document.getElementById('star-label');
  const starBtns = document.querySelectorAll('#star-rating-container .star-btn');

  if (ratingInput) ratingInput.value = selectedRating;
  if (starLabel) starLabel.textContent = RATING_LABELS[selectedRating] || `${selectedRating} Stars`;

  starBtns.forEach((btn, idx) => {
    const starVal = idx + 1;
    if (starVal <= selectedRating) {
      btn.className = 'star-btn text-amber-400 transition-colors p-1 transform scale-110';
    } else {
      btn.className = 'star-btn text-on-surface-variant/30 hover:text-amber-400 transition-colors p-1';
    }
  });
}

function initFeedbackPage() {
  parseUrlParams();

  const day1Btn = document.getElementById('fb-day1-btn');
  const day2Btn = document.getElementById('fb-day2-btn');
  const starBtns = document.querySelectorAll('#star-rating-container .star-btn');
  const feedbackForm = document.getElementById('feedback-form');
  const submitBtn = document.getElementById('fb-submit-btn');
  const feedbackMsg = document.getElementById('fb-feedback-msg');

  if (day1Btn) day1Btn.addEventListener('click', () => setDay('day1'));
  if (day2Btn) day2Btn.addEventListener('click', () => setDay('day2'));

  starBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.getAttribute('data-value'), 10);
      if (!isNaN(val)) setRating(val);
    });
  });

  setRating(5);

  if (feedbackForm) {
    feedbackForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const regId = document.getElementById('fb-reg-id')?.value.trim();
      const liked = document.getElementById('fb-liked')?.value.trim();
      const disliked = document.getElementById('fb-disliked')?.value.trim();
      const suggestions = document.getElementById('fb-suggestions')?.value.trim();

      if (!regId) {
        if (feedbackMsg) {
          feedbackMsg.textContent = '[ ERROR ]: Please enter your Registration ID.';
          feedbackMsg.style.color = '#ffb4ab';
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'TRANSMITTING... <span class="material-symbols-outlined text-sm animate-spin">sync</span>';
      }
      if (feedbackMsg) feedbackMsg.textContent = '';

      try {
        const payload = {
          registration_id: regId,
          day: selectedDay,
          rating: selectedRating,
          liked,
          disliked,
          suggestions
        };

        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const resData = await res.json().catch(() => ({}));

        if (res.ok && resData.success) {
          if (feedbackMsg) {
            feedbackMsg.textContent = `✓ ${resData.message || 'Feedback submitted successfully. Thank you!'}`;
            feedbackMsg.style.color = '#4ade80';
          }
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'FEEDBACK SUBMITTED <span class="material-symbols-outlined text-sm">check_circle</span>';
          }
        } else {
          const errMsg = resData.message || 'Failed to submit feedback. Please try again.';
          if (feedbackMsg) {
            feedbackMsg.textContent = `[ FAILURE ]: ${errMsg}`;
            feedbackMsg.style.color = '#ffb4ab';
          }
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'TRANSMIT FEEDBACK <span class="material-symbols-outlined text-base">send</span>';
          }
        }
      } catch (err) {
        console.error('Feedback submission error:', err);
        if (feedbackMsg) {
          feedbackMsg.textContent = '[ ERROR ]: Connection error. Please check your network.';
          feedbackMsg.style.color = '#ffb4ab';
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'TRANSMIT FEEDBACK <span class="material-symbols-outlined text-base">send</span>';
        }
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFeedbackPage);
} else {
  initFeedbackPage();
}
