import jsQR from 'jsqr';
import { saveCoordinatorRosterOffline, getCoordinatorRosterOffline } from './lib/offline-db.js';

// Register Service Worker for static PWA caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[PWA] Service Worker registration failed:', err);
    });
  });
}

const EVENT_METADATA = {
  "CLUE'D UP": {
    day: 'DAY 1 — SEPTEMBER 30',
    date: 'SEPTEMBER 30, 2026',
    time: '9:30 AM – 3:00 PM',
    venue: 'Loyalty – 3 Block (C-Block)',
    color: '#E50914'
  },
  "HAWKINS TRAP": {
    day: 'DAY 1 — SEPTEMBER 30',
    date: 'SEPTEMBER 30, 2026',
    time: '9:30 AM – 3:00 PM',
    venue: 'Loyalty – 3 Block (C-Block)',
    color: '#E50914'
  },
  "DARK PROTOCOL": {
    day: 'DAY 2 — OCTOBER 1',
    date: 'OCTOBER 1, 2026',
    time: '9:00 AM – 1:00 PM',
    venue: 'Loyalty – 3 Block (C-Block)',
    color: '#00F0FF'
  },
  "GENOVA": {
    day: 'DAY 2 — OCTOBER 1',
    date: 'OCTOBER 1, 2026',
    time: '9:00 AM – 1:00 PM',
    venue: 'Computer Lab',
    color: '#10B981'
  }
};

let currentEvent = "CLUE'D UP";
let searchTimer = null;
let activeVideoTrack = null;
let animScanFrame = null;

function maskEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) return '—';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  const firstChar = local[0];
  const lastChar = local[local.length - 1];
  return `${firstChar}***${lastChar}@${domain}`;
}

// Session Auth Token Manager
function getAuthToken(eventTrack) {
  const targetEvent = eventTrack || currentEvent;
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get('token') || urlParams.get('key') || urlParams.get('secret') || urlParams.get('t');

  if (urlToken && urlToken.trim().length > 0) {
    const cleanToken = urlToken.trim();
    sessionStorage.setItem(`exousia_coord_key_${targetEvent}`, cleanToken);
    sessionStorage.setItem('exousia_coord_token', cleanToken);
    return cleanToken;
  }

  return sessionStorage.getItem(`exousia_coord_key_${targetEvent}`) || sessionStorage.getItem('exousia_coord_token') || '';
}

function setAuthToken(eventTrack, token) {
  const targetEvent = eventTrack || currentEvent;
  if (token && token.trim()) {
    const cleanToken = token.trim();
    sessionStorage.setItem(`exousia_coord_key_${targetEvent}`, cleanToken);
    sessionStorage.setItem('exousia_coord_token', cleanToken);
  } else {
    sessionStorage.removeItem(`exousia_coord_key_${targetEvent}`);
    sessionStorage.removeItem('exousia_coord_token');
  }
}

function clearAuthToken(eventTrack) {
  const targetEvent = eventTrack || currentEvent;
  sessionStorage.removeItem(`exousia_coord_key_${targetEvent}`);
  sessionStorage.removeItem('exousia_coord_token');
}

function getInitialEvent() {
  const urlParams = new URLSearchParams(window.location.search);
  const urlEvent = urlParams.get('event') || urlParams.get('track') || urlParams.get('e');
  if (urlEvent && urlEvent.trim().length > 0) {
    const norm = urlEvent.trim().toUpperCase();
    if (norm.includes('CLUE')) return "CLUE'D UP";
    if (norm.includes('HAWKINS')) return "HAWKINS TRAP";
    if (norm.includes('DARK')) return "DARK PROTOCOL";
    if (norm.includes('GENOVA')) return "GENOVA";
  }
  return "CLUE'D UP";
}

function updateEventCardSelection(activeEvent) {
  const cards = document.querySelectorAll('.event-select-card');
  cards.forEach(card => {
    const ev = card.getAttribute('data-event');
    if (ev === activeEvent) {
      card.classList.add('border-[#E50914]', 'bg-[#141A21]', 'shadow-lg');
      card.classList.remove('border-white/10', 'bg-[#0F141C]');
    } else {
      card.classList.remove('border-[#E50914]', 'bg-[#141A21]', 'shadow-lg');
      card.classList.add('border-white/10', 'bg-[#0F141C]');
    }
  });
}

function hideAllOverlays() {
  const ids = ['coord-state-loading', 'coord-state-empty', 'coord-state-no-offline'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}

function showOverlay(id) {
  hideAllOverlays();
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

// Render Unauthenticated State (Prompt to enter access key)
function renderUnauthenticatedState() {
  const authPanel = document.getElementById('coord-auth-panel');
  const dashboard = document.getElementById('coord-protected-dashboard');
  const targetEventEl = document.getElementById('auth-target-event');
  const authErrorEl = document.getElementById('coord-auth-error');
  const keyBtnLabel = document.getElementById('coord-key-btn-label');
  const keyInput = document.getElementById('coord-key-input');

  if (targetEventEl) targetEventEl.textContent = currentEvent;
  if (authErrorEl) authErrorEl.classList.add('hidden');
  if (keyBtnLabel) keyBtnLabel.textContent = 'ENTER KEY';
  if (keyInput) keyInput.value = '';

  if (authPanel) authPanel.classList.remove('hidden');
  if (dashboard) dashboard.classList.add('hidden');
}

// Render Auth Error State (Invalid key submitted)
function renderAuthErrorState(errorMessage) {
  renderUnauthenticatedState();
  const authErrorEl = document.getElementById('coord-auth-error');
  const authErrorText = document.getElementById('coord-auth-error-text');

  if (authErrorText) authErrorText.textContent = errorMessage || 'Invalid access key for selected event.';
  if (authErrorEl) authErrorEl.classList.remove('hidden');
}

// Render Authenticated State (Protected Dashboard & Roster)
function renderAuthenticatedState(records, totalCount, offlineMetadata = null) {
  const authPanel = document.getElementById('coord-auth-panel');
  const dashboard = document.getElementById('coord-protected-dashboard');
  const authEventTitle = document.getElementById('authenticated-event-title');
  const keyBtnLabel = document.getElementById('coord-key-btn-label');
  const statTotal = document.getElementById('stat-total-count');
  const statEventName = document.getElementById('stat-event-name');
  const statEventDate = document.getElementById('stat-event-date');
  const statEventTime = document.getElementById('stat-event-time');
  const statEventVenue = document.getElementById('stat-event-venue');
  const tableRecordCount = document.getElementById('table-record-count');
  const tableBody = document.getElementById('coord-table-body');
  const mobileList = document.getElementById('coord-mobile-list');
  const offlineBanner = document.getElementById('coord-offline-banner');
  const offlineSyncDate = document.getElementById('coord-offline-sync-date');

  if (authPanel) authPanel.classList.add('hidden');
  if (dashboard) dashboard.classList.remove('hidden');
  if (authEventTitle) authEventTitle.textContent = currentEvent;
  if (keyBtnLabel) keyBtnLabel.textContent = 'KEY SET';

  // Toggle Offline Banner Indicator
  if (offlineBanner) {
    if (offlineMetadata || !navigator.onLine) {
      offlineBanner.classList.remove('hidden');
      if (offlineSyncDate && offlineMetadata && offlineMetadata.synced_at) {
        try {
          const d = new Date(offlineMetadata.synced_at);
          offlineSyncDate.textContent = `LAST SYNCED: ${d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()}, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } catch (e) {}
      }
    } else {
      offlineBanner.classList.add('hidden');
    }
  }

  // Update Summary Metadata Cards
  const meta = EVENT_METADATA[currentEvent] || EVENT_METADATA["CLUE'D UP"];
  if (statEventName) statEventName.textContent = currentEvent;
  if (statEventDate) statEventDate.textContent = meta.date;
  if (statEventTime) statEventTime.textContent = meta.time;
  if (statEventVenue) statEventVenue.textContent = meta.venue.toUpperCase();

  const countVal = totalCount !== undefined ? totalCount : records.length;
  if (statTotal) statTotal.textContent = countVal;
  if (tableRecordCount) tableRecordCount.textContent = records.length;

  hideAllOverlays();

  if (records.length === 0) {
    if (tableBody) tableBody.innerHTML = '';
    if (mobileList) mobileList.innerHTML = '';
    showOverlay('coord-state-empty');
    return;
  }

  // Render Desktop Table
  if (tableBody) {
    tableBody.innerHTML = records.map((rec, index) => {
      const formattedDate = rec.created_at ? new Date(rec.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'SEP 30, 2026';
      const maskedEm = maskEmail(rec.email);
      const statusUpper = (rec.status || 'CONFIRMED').toUpperCase();

      return `
        <tr class="hover:bg-[#141A21] transition-colors border-b border-white/5">
          <td class="py-3.5 px-4 text-[#737B85] font-bold">${index + 1}</td>
          <td class="py-3.5 px-4 font-bold text-[#F3E7D3] uppercase">${rec.full_name || 'Participant'}</td>
          <td class="py-3.5 px-4 text-[#00F0FF] font-bold select-text font-mono">${rec.registration_id || 'EX-2026'}</td>
          <td class="py-3.5 px-4 text-[#A9B0B8]">${rec.college || 'Institution'}</td>
          <td class="py-3.5 px-4 text-[#A9B0B8] font-mono text-[11px] select-text">${maskedEm}</td>
          <td class="py-3.5 px-4 text-[#737B85] whitespace-nowrap">${formattedDate}</td>
          <td class="py-3.5 px-4">
            <span class="px-2.5 py-1 rounded-md text-[10px] font-bold border bg-emerald-950/60 text-emerald-400 border-emerald-500/30">
              ✓ ${statusUpper}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Render Mobile List
  if (mobileList) {
    mobileList.innerHTML = records.map((rec) => {
      const formattedDate = rec.created_at ? new Date(rec.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : 'SEP 30';
      const maskedEm = maskEmail(rec.email);
      const statusUpper = (rec.status || 'CONFIRMED').toUpperCase();
      return `
        <div class="bg-[#141A21] border border-white/10 p-4 rounded-xl space-y-2 font-mono text-xs">
          <div class="flex items-center justify-between">
            <span class="text-[#00F0FF] font-bold select-text">${rec.registration_id || 'EX-2026'}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
              ✓ ${statusUpper}
            </span>
          </div>
          <div>
            <h4 class="font-bold text-[#F3E7D3] text-sm uppercase">${rec.full_name || 'Participant'}</h4>
            <p class="text-[#A9B0B8] text-[11px]">${rec.college || 'Institution'}</p>
          </div>
          <div class="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-[#737B85]">
            <span class="select-text font-mono">${maskedEm}</span>
            <span>${formattedDate}</span>
          </div>
        </div>
      `;
    }).join('');
  }
}

// Verification Tool: Direct Lookup by Registration ID or QR Payload (Supports Offline Snapshot)
async function verifyRegistrationId(rawId) {
  const resultCard = document.getElementById('coord-verify-result-card');
  if (!resultCard || !rawId) return;

  let cleanId = String(rawId).trim().toUpperCase();
  if (cleanId.includes('ID=')) {
    cleanId = cleanId.split('ID=')[1].split('&')[0].trim();
  }
  if (cleanId.startsWith('EXOUSIA:')) {
    cleanId = cleanId.replace(/^EXOUSIA:/, '').trim();
  }

  resultCard.className = 'p-4 rounded-xl border bg-[#141A21] border-white/20 text-white font-mono text-xs animate-pulse';
  resultCard.innerHTML = `<span class="material-symbols-outlined text-base text-[#00F0FF] animate-spin inline-block mr-2">sync</span> VERIFYING TELEMETRY FOR ${cleanId}...`;
  resultCard.classList.remove('hidden');

  // Check if online or offline
  if (navigator.onLine) {
    try {
      const res = await fetch(`/api/verify-registration?id=${encodeURIComponent(cleanId)}`);
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success && data.valid && data.registration) {
        const rec = data.registration;
        const regEvent = String(rec.selected_event || '').toUpperCase();
        const currentNorm = String(currentEvent).toUpperCase();

        const isEventMatched = regEvent.includes(currentNorm.split(' ')[0]) || currentNorm.includes(regEvent.split(' ')[0]);

        if (isEventMatched) {
          resultCard.className = 'p-5 rounded-xl border bg-[#122017] border-emerald-500/50 text-white font-mono text-xs space-y-3 shadow-xl';
          resultCard.innerHTML = `
            <div class="flex justify-between items-center border-b border-emerald-500/30 pb-2">
              <span class="text-[#10B981] font-bold text-sm flex items-center gap-1.5 uppercase">
                <span class="material-symbols-outlined text-base">check_circle</span> ✓ REGISTRATION VERIFIED
              </span>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                MATCHED EVENT SCOPE
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span class="text-[9px] text-[#A9B0B8] uppercase block">PARTICIPANT NAME</span>
                <span class="font-bold text-white text-sm uppercase">${rec.full_name || 'Participant'}</span>
              </div>
              <div>
                <span class="text-[9px] text-[#A9B0B8] uppercase block">REGISTRATION ID</span>
                <span class="font-bold text-[#00F0FF] font-mono text-sm">${rec.registration_id}</span>
              </div>
              <div>
                <span class="text-[9px] text-[#A9B0B8] uppercase block">COLLEGE / INSTITUTE</span>
                <span class="text-[#F3E7D3]">${rec.college || 'Institution'}</span>
              </div>
              <div>
                <span class="text-[9px] text-[#A9B0B8] uppercase block">ASSIGNED EVENT</span>
                <span class="text-[#10B981] font-bold uppercase">${rec.selected_event}</span>
              </div>
            </div>
          `;
          return;
        } else {
          resultCard.className = 'p-5 rounded-xl border bg-[#251416] border-red-500/50 text-white font-mono text-xs space-y-2 shadow-xl';
          resultCard.innerHTML = `
            <div class="flex items-center gap-2 text-red-400 font-bold uppercase text-sm border-b border-red-500/30 pb-2">
              <span class="material-symbols-outlined text-base">warning</span> ✕ WRONG EVENT TRACK — ENTRY DENIED
            </div>
            <p class="text-[#F3E7D3]">Participant <strong class="text-white">${rec.full_name}</strong> (${rec.registration_id}) is registered for <strong class="text-[#E50914]">${rec.selected_event}</strong>.</p>
            <p class="text-[11px] text-[#A9B0B8]">You are currently operating the <strong class="text-white">${currentEvent}</strong> desk. Please direct the participant to their assigned event track.</p>
          `;
          return;
        }
      }
    } catch (err) {
      console.warn('Online verification failed, evaluating offline snapshot:', err);
    }
  }

  // OFFLINE SEARCH FALLBACK against cached IndexedDB snapshot
  const offlineRoster = await getCoordinatorRosterOffline(currentEvent);

  if (offlineRoster && Array.isArray(offlineRoster.records)) {
    const matched = offlineRoster.records.find(r => r.registration_id === cleanId || String(r.full_name).toUpperCase().includes(cleanId));

    if (matched) {
      resultCard.className = 'p-5 rounded-xl border bg-[#122017] border-emerald-500/50 text-white font-mono text-xs space-y-3 shadow-xl';
      resultCard.innerHTML = `
        <div class="flex justify-between items-center border-b border-emerald-500/30 pb-2">
          <span class="text-[#10B981] font-bold text-sm flex items-center gap-1.5 uppercase">
            <span class="material-symbols-outlined text-base">check_circle</span> ✓ REGISTRATION VERIFIED (OFFLINE ROSTER)
          </span>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-500/40">
            OFFLINE SNAPSHOT
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span class="text-[9px] text-[#A9B0B8] uppercase block">PARTICIPANT NAME</span>
            <span class="font-bold text-white text-sm uppercase">${matched.full_name}</span>
          </div>
          <div>
            <span class="text-[9px] text-[#A9B0B8] uppercase block">REGISTRATION ID</span>
            <span class="font-bold text-[#00F0FF] font-mono text-sm">${matched.registration_id}</span>
          </div>
          <div>
            <span class="text-[9px] text-[#A9B0B8] uppercase block">COLLEGE / INSTITUTE</span>
            <span class="text-[#F3E7D3]">${matched.college}</span>
          </div>
          <div>
            <span class="text-[9px] text-[#A9B0B8] uppercase block">ASSIGNED EVENT</span>
            <span class="text-[#10B981] font-bold uppercase">${matched.selected_event}</span>
          </div>
        </div>
      `;
      return;
    }
  }

  // NOT FOUND IN OFFLINE ROSTER
  resultCard.className = 'p-4 rounded-xl border bg-[#251416] border-amber-500/50 text-white font-mono text-xs space-y-1';
  resultCard.innerHTML = `
    <div class="text-amber-400 font-bold uppercase flex items-center gap-1.5 font-bold">
      <span class="material-symbols-outlined text-base">cloud_off</span> ${navigator.onLine ? 'REGISTRATION NOT FOUND' : '⚡ OFFLINE MODE — ID NOT FOUND IN SAVED ROSTER'}
    </div>
    <p class="text-[#A9B0B8]">Registration ID <strong class="text-white">${cleanId}</strong> is not present in the saved <strong class="text-white">${currentEvent}</strong> roster.</p>
  `;
}

let activeLoadedRecords = [];

// Load Coordinator Data API Execution (Supports Offline Snapshot)
async function loadCoordinatorData(attemptedToken) {
  const eventSelect = document.getElementById('coord-event-select');
  const searchInput = document.getElementById('coord-search-input');

  if (eventSelect) {
    currentEvent = eventSelect.value || "CLUE'D UP";
  }

  updateEventCardSelection(currentEvent);

  const token = attemptedToken || getAuthToken(currentEvent);
  const searchVal = searchInput ? searchInput.value.trim().toUpperCase() : '';

  // 1. If Offline: Load from IndexedDB snapshot directly
  if (!navigator.onLine) {
    const offlineSnapshot = await getCoordinatorRosterOffline(currentEvent);
    if (offlineSnapshot && Array.isArray(offlineSnapshot.records)) {
      let filtered = offlineSnapshot.records;
      if (searchVal) {
        filtered = filtered.filter(r =>
          r.registration_id.includes(searchVal) ||
          r.full_name.includes(searchVal) ||
          r.college.includes(searchVal)
        );
      }
      activeLoadedRecords = offlineSnapshot.records;
      renderAuthenticatedState(filtered, offlineSnapshot.total_count, offlineSnapshot);
    } else {
      const dashboard = document.getElementById('coord-protected-dashboard');
      const authPanel = document.getElementById('coord-auth-panel');
      if (authPanel) authPanel.classList.add('hidden');
      if (dashboard) dashboard.classList.remove('hidden');
      const noOfflineMsgEl = document.getElementById('no-offline-msg');
      if (noOfflineMsgEl) {
        noOfflineMsgEl.textContent = `No saved offline roster snapshot found for ${currentEvent}. Connect to the internet and save the roster before going offline.`;
      }
      showOverlay('coord-state-no-offline');
    }
    return;
  }

  // 2. If Online: Check token authentication
  if (!token) {
    renderUnauthenticatedState();
    return;
  }

  showOverlay('coord-state-loading');

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

    if (res.status === 403) {
      clearAuthToken(currentEvent);
      renderAuthErrorState(`Access key is not authorized for ${currentEvent}.`);
      return;
    }

    if (res.status === 401) {
      clearAuthToken(currentEvent);
      renderAuthErrorState(`Invalid access key for ${currentEvent}. Please check your key.`);
      return;
    }

    if (res.ok && data.success) {
      setAuthToken(currentEvent, token);
      activeLoadedRecords = data.records || [];
      renderAuthenticatedState(activeLoadedRecords, data.totalCount);
    } else {
      clearAuthToken(currentEvent);
      renderAuthErrorState(data.message || `Authentication failed for ${currentEvent}.`);
    }

  } catch (err) {
    console.error('Coordinator Load Error, attempting offline roster fallback:', err);
    
    // Fallback to offline DB snapshot if network fails during online operation
    const offlineSnapshot = await getCoordinatorRosterOffline(currentEvent);
    if (offlineSnapshot && Array.isArray(offlineSnapshot.records)) {
      activeLoadedRecords = offlineSnapshot.records;
      renderAuthenticatedState(offlineSnapshot.records, offlineSnapshot.total_count, offlineSnapshot);
    } else {
      renderAuthErrorState(`Connection error: ${err.message}`);
    }
  }
}

// Save Coordinator Roster for Offline Use (Explicit Action)
async function saveOfflineRosterAction() {
  const saveBtn = document.getElementById('coord-save-offline-btn');
  if (!saveBtn) return;

  if (!navigator.onLine) {
    alert('Cannot save new snapshot while offline. Please connect to internet.');
    return;
  }

  const token = getAuthToken(currentEvent);
  if (!token) {
    alert('Please authenticate with access key first.');
    return;
  }

  saveBtn.disabled = true;
  const originalText = saveBtn.innerHTML;
  saveBtn.innerHTML = `<span class="material-symbols-outlined text-sm animate-spin inline-block mr-1">sync</span> SAVING SNAPSHOT...`;

  try {
    const res = await fetch(`/api/coordinator/registrations?event=${encodeURIComponent(currentEvent)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data.success && Array.isArray(data.records)) {
      const snapshot = await saveCoordinatorRosterOffline(currentEvent, data.records);
      if (snapshot) {
        saveBtn.className = 'px-3.5 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 font-mono text-xs flex items-center gap-1.5 font-bold';
        saveBtn.innerHTML = `<span class="material-symbols-outlined text-sm">check_circle</span> OFFLINE ROSTER SAVED (${data.records.length} RECS)`;
        setTimeout(() => {
          saveBtn.className = 'px-3.5 py-1.5 rounded-lg bg-[#00F0FF]/15 border border-[#00F0FF]/40 hover:bg-[#00F0FF]/30 text-[#00F0FF] hover:text-white font-mono text-xs transition-colors flex items-center gap-1.5 cursor-pointer font-bold';
          saveBtn.innerHTML = originalText;
          saveBtn.disabled = false;
        }, 3000);
        return;
      }
    }
    alert('Failed to save offline snapshot. Please try again.');
  } catch (err) {
    alert(`Snapshot failed: ${err.message}`);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalText;
  }
}

// Camera QR Scanner Engine for Coordinator
async function startCameraScanner() {
  const modal = document.getElementById('coord-qr-modal');
  const video = document.getElementById('modal-scanner-video');
  const canvas = document.getElementById('modal-scanner-canvas');
  const placeholder = document.getElementById('modal-scanner-placeholder');

  if (!modal || !video || !canvas) return;

  modal.classList.remove('hidden');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });

    activeVideoTrack = stream;
    video.srcObject = stream;
    video.setAttribute('playsinline', 'true');
    video.classList.remove('hidden');
    if (placeholder) placeholder.classList.add('hidden');
    await video.play();

    const ctx = canvas.getContext('2d');

    const scanFrame = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data) {
          stopCameraScanner();
          verifyRegistrationId(code.data);
          return;
        }
      }
      animScanFrame = requestAnimationFrame(scanFrame);
    };

    scanFrame();

  } catch (err) {
    alert('Camera permission denied or camera unavailable. You can enter the Registration ID manually.');
    stopCameraScanner();
  }
}

function stopCameraScanner() {
  const modal = document.getElementById('coord-qr-modal');
  const video = document.getElementById('modal-scanner-video');
  const placeholder = document.getElementById('modal-scanner-placeholder');

  if (animScanFrame) cancelAnimationFrame(animScanFrame);
  if (activeVideoTrack) {
    activeVideoTrack.getTracks().forEach(t => t.stop());
    activeVideoTrack = null;
  }
  if (video) video.classList.add('hidden');
  if (placeholder) placeholder.classList.remove('hidden');
  if (modal) modal.classList.add('hidden');
}

function initCoordinatorPage() {
  const eventSelect = document.getElementById('coord-event-select');
  const searchInput = document.getElementById('coord-search-input');
  const refreshBtn = document.getElementById('coord-refresh-btn');
  const saveOfflineBtn = document.getElementById('coord-save-offline-btn');
  const keyEntryBtn = document.getElementById('coord-key-prompt-btn');
  const authForm = document.getElementById('coord-auth-form');
  const keyInput = document.getElementById('coord-key-input');
  const logoutBtn = document.getElementById('btn-logout-coord');
  const searchIdBtn = document.getElementById('coord-btn-search-id');
  const scanQrBtn = document.getElementById('coord-btn-scan-qr');
  const closeQrModalBtn = document.getElementById('btn-close-qr-modal');
  const stopQrModalBtn = document.getElementById('btn-stop-modal-camera');

  const initEvent = getInitialEvent();
  if (eventSelect) {
    eventSelect.value = initEvent;
    eventSelect.addEventListener('change', () => {
      currentEvent = eventSelect.value;
      const verifyCard = document.getElementById('coord-verify-result-card');
      if (verifyCard) verifyCard.classList.add('hidden');
      loadCoordinatorData();
    });
  }

  // Network Online / Offline Listeners
  window.addEventListener('online', () => {
    loadCoordinatorData();
  });
  window.addEventListener('offline', () => {
    loadCoordinatorData();
  });

  // 4 Event Selector Cards Click Handlers
  const eventCards = document.querySelectorAll('.event-select-card');
  eventCards.forEach(card => {
    card.addEventListener('click', () => {
      const selectedEv = card.getAttribute('data-event');
      if (selectedEv) {
        currentEvent = selectedEv;
        if (eventSelect) eventSelect.value = selectedEv;

        const verifyCard = document.getElementById('coord-verify-result-card');
        if (verifyCard) verifyCard.classList.add('hidden');

        loadCoordinatorData();
      }
    });
  });

  // Auth Form Submit Handler
  if (authForm) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredKey = keyInput ? keyInput.value.trim() : '';
      if (enteredKey) {
        loadCoordinatorData(enteredKey);
      }
    });
  }

  // Save Offline Roster Button Handler
  if (saveOfflineBtn) {
    saveOfflineBtn.addEventListener('click', saveOfflineRosterAction);
  }

  // Logout / Change Event Button Handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearAuthToken(currentEvent);
      renderUnauthenticatedState();
    });
  }

  // Key Prompt Button in Top Nav
  if (keyEntryBtn) {
    keyEntryBtn.addEventListener('click', () => {
      renderUnauthenticatedState();
      const keyInput = document.getElementById('coord-key-input');
      if (keyInput) keyInput.focus();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        const val = searchInput.value.trim();
        if (/^EX-2026-[A-Z0-9]{6}$/i.test(val)) {
          verifyRegistrationId(val);
        } else {
          loadCoordinatorData();
        }
      }, 300);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = searchInput.value.trim();
        if (val) verifyRegistrationId(val);
      }
    });
  }

  if (searchIdBtn) {
    searchIdBtn.addEventListener('click', () => {
      const val = searchInput ? searchInput.value.trim() : '';
      if (val) {
        verifyRegistrationId(val);
      } else {
        const promptId = prompt('Enter Participant Registration ID (e.g. EX-2026-6LSTPW):');
        if (promptId && promptId.trim()) {
          verifyRegistrationId(promptId.trim());
        }
      }
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadCoordinatorData();
    });
  }

  if (scanQrBtn) {
    scanQrBtn.addEventListener('click', () => {
      startCameraScanner();
    });
  }

  if (closeQrModalBtn) {
    closeQrModalBtn.addEventListener('click', stopCameraScanner);
  }

  if (stopQrModalBtn) {
    stopQrModalBtn.addEventListener('click', stopCameraScanner);
  }

  // Initial Load
  loadCoordinatorData();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCoordinatorPage);
} else {
  initCoordinatorPage();
}
