// EXOUSIA 2K26 — Restricted Event Coordinator Portal JS
// Purpose: Fetch and display event-scoped participant details with server-side token authentication.

const EVENT_METADATA = {
  "CLUE'D UP": {
    day: 'DAY 1 — SEPTEMBER 30',
    date: 'SEPTEMBER 30',
    time: '9:30 AM – 3:00 PM',
    venue: 'Loyalty – 3 Block (C-Block)'
  },
  "HAWKINS TRAP": {
    day: 'DAY 1 — SEPTEMBER 30',
    date: 'SEPTEMBER 30',
    time: '9:30 AM – 3:00 PM',
    venue: 'Loyalty – 3 Block (C-Block)'
  },
  "DARK PROTOCOL": {
    day: 'DAY 2 — OCTOBER 1',
    date: 'OCTOBER 1',
    time: '9:00 AM – 1:00 PM',
    venue: 'Loyalty – 3 Block (C-Block)'
  },
  "GENOVA": {
    day: 'DAY 2 — OCTOBER 1',
    date: 'OCTOBER 1',
    time: '9:00 AM – 1:00 PM',
    venue: 'Computer Lab'
  }
};

let currentEvent = "CLUE'D UP";
let searchTimer = null;

function getSavedKey() {
  const inputEl = document.getElementById('coord-key-input');
  if (inputEl && inputEl.value.trim().length > 0) {
    const val = inputEl.value.trim();
    sessionStorage.setItem('exousia_coord_key', val);
    return val;
  }
  return sessionStorage.getItem('exousia_coord_key') || '';
}

async function loadCoordinatorData() {
  const eventSelect = document.getElementById('coord-event-select');
  const searchInput = document.getElementById('coord-search-input');
  const tableBody = document.getElementById('coord-table-body');
  const statTotal = document.getElementById('stat-total-count');
  const statEventName = document.getElementById('stat-event-name');
  const statEventDate = document.getElementById('stat-event-date');
  const statEventTime = document.getElementById('stat-event-time');
  const statEventVenue = document.getElementById('stat-event-venue');
  const tableRecordCount = document.getElementById('table-record-count');

  if (eventSelect) {
    currentEvent = eventSelect.value || "CLUE'D UP";
  }

  const token = getSavedKey();
  const searchVal = searchInput ? searchInput.value.trim() : '';

  // Update Metadata Cards
  const meta = EVENT_METADATA[currentEvent] || EVENT_METADATA["CLUE'D UP"];
  if (statEventName) statEventName.textContent = currentEvent;
  if (statEventDate) statEventDate.textContent = meta.date;
  if (statEventTime) statEventTime.textContent = meta.time;
  if (statEventVenue) statEventVenue.textContent = meta.venue.toUpperCase();

  if (!token) {
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="py-8 text-center text-amber-400 font-bold">
            [ 401 UNAUTHORIZED ]: Please enter your coordinator secret key in the header input to unlock ${currentEvent} records.
          </td>
        </tr>
      `;
    }
    if (statTotal) statTotal.textContent = '0';
    if (tableRecordCount) tableRecordCount.textContent = '0';
    return;
  }

  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="py-8 text-center text-on-surface-variant">
          <div class="flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-primary animate-spin">sync</span> Authorizing and loading records for ${currentEvent}...
          </div>
        </td>
      </tr>
    `;
  }

  try {
    const queryParams = new URLSearchParams();
    queryParams.set('event', currentEvent);
    if (searchVal) queryParams.set('search', searchVal);

    const res = await fetch(`/api/coordinator/registrations?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="7" class="py-8 text-center text-red-400 font-bold">
              [ 401 UNAUTHORIZED ]: Invalid coordinator secret key. Access denied.
            </td>
          </tr>
        `;
      }
      if (statTotal) statTotal.textContent = '0';
      if (tableRecordCount) tableRecordCount.textContent = '0';
      return;
    }

    if (res.status === 403) {
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="7" class="py-8 text-center text-red-400 font-bold">
              [ 403 FORBIDDEN ]: Your coordinator key is NOT authorized to access ${currentEvent} registrations.
            </td>
          </tr>
        `;
      }
      if (statTotal) statTotal.textContent = '0';
      if (tableRecordCount) tableRecordCount.textContent = '0';
      return;
    }

    if (res.ok && data.success) {
      const records = data.records || [];
      const totalCount = data.totalCount || records.length;

      if (statTotal) statTotal.textContent = totalCount;
      if (tableRecordCount) tableRecordCount.textContent = records.length;

      if (records.length === 0) {
        if (tableBody) {
          tableBody.innerHTML = `
            <tr>
              <td colspan="7" class="py-8 text-center text-on-surface-variant">
                No participant registrations found matching the current search criteria.
              </td>
            </tr>
          `;
        }
        return;
      }

      if (tableBody) {
        tableBody.innerHTML = records.map((rec, index) => {
          const formattedDate = rec.created_at ? new Date(rec.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : 'SEPT 30';
          return `
            <tr class="hover:bg-surface-container/40 transition-colors">
              <td class="py-3 px-3 text-on-surface-variant font-bold">${index + 1}</td>
              <td class="py-3 px-3 text-primary font-bold select-text">${rec.registration_id || 'EX-2026'}</td>
              <td class="py-3 px-3 font-bold text-on-surface uppercase">${rec.full_name || 'Participant'}</td>
              <td class="py-3 px-3 text-on-surface-variant">${rec.college || 'Institution'}</td>
              <td class="py-3 px-3 text-on-surface-variant select-text">${rec.email || '-'}</td>
              <td class="py-3 px-3 text-on-surface-variant">${formattedDate}</td>
              <td class="py-3 px-3">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                  ${rec.status || 'CONFIRMED'}
                </span>
              </td>
            </tr>
          `;
        }).join('');
      }
    } else {
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="7" class="py-8 text-center text-red-400">
              [ ERROR ]: Failed to retrieve coordinator records. ${data.message || ''}
            </td>
          </tr>
        `;
      }
    }
  } catch (err) {
    console.error('Coordinator Load Error:', err);
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="py-8 text-center text-red-400">
            [ ERROR ]: Connection failed. Please check network connection.
          </td>
        </tr>
      `;
    }
  }
}

function initCoordinatorPage() {
  const eventSelect = document.getElementById('coord-event-select');
  const searchInput = document.getElementById('coord-search-input');
  const keyInput = document.getElementById('coord-key-input');
  const refreshBtn = document.getElementById('coord-refresh-btn');

  // Load saved key if available
  const savedKey = sessionStorage.getItem('exousia_coord_key');
  if (savedKey && keyInput) {
    keyInput.value = savedKey;
  }

  if (keyInput) {
    keyInput.addEventListener('input', () => {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(loadCoordinatorData, 400);
    });
  }

  if (eventSelect) {
    eventSelect.addEventListener('change', () => {
      loadCoordinatorData();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(loadCoordinatorData, 300);
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadCoordinatorData();
    });
  }

  loadCoordinatorData();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCoordinatorPage);
} else {
  initCoordinatorPage();
}
