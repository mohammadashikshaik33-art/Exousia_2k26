import QRCode from 'qrcode';

// State Management for EXOUSIA Admin Workspace
let adminSecret = sessionStorage.getItem('exousia_admin_secret') || '';
let currentPage = 1;
let pageSize = 25;
let searchQuery = '';
let eventFilter = 'ALL';
let statusFilter = 'ALL';
let sortOrder = 'newest';
let totalRecords = 0;
let totalPages = 0;
let activeRecords = [];
let currentDetailRecord = null;
let searchDebounceTimer = null;

// DOM Element References
const secretInput = document.getElementById('admin-secret-input');
const toggleSecretBtn = document.getElementById('toggle-secret-visibility');
const authBtn = document.getElementById('admin-auth-btn');
const logoutBtn = document.getElementById('admin-logout-btn');
const statusBadge = document.getElementById('admin-status-badge');
const refreshBtn = document.getElementById('admin-refresh-btn');

const searchInput = document.getElementById('admin-search-input');
const eventFilterSelect = document.getElementById('admin-event-filter');
const statusFilterSelect = document.getElementById('admin-status-filter');
const sortFilterSelect = document.getElementById('admin-sort-filter');
const pageSizeFilterSelect = document.getElementById('admin-pagesize-filter');

const tableBody = document.getElementById('admin-table-body');
const stateLoading = document.getElementById('admin-state-loading');
const stateEmpty = document.getElementById('admin-state-empty');
const stateSearchEmpty = document.getElementById('admin-state-search-empty');
const stateUnauthorized = document.getElementById('admin-state-unauthorized');
const stateError = document.getElementById('admin-state-error');
const searchEmptyMsg = document.getElementById('search-empty-msg');
const errorMsgEl = document.getElementById('admin-error-msg');

const paginationInfo = document.getElementById('admin-pagination-info');
const prevBtn = document.getElementById('admin-prev-btn');
const nextBtn = document.getElementById('admin-next-btn');

const metricTotal = document.getElementById('metric-total');
const metricCluedUp = document.getElementById('metric-cluedup');
const metricHawkins = document.getElementById('metric-hawkins');
const metricDarkProtocol = document.getElementById('metric-darkprotocol');
const metricGenova = document.getElementById('metric-genova') || document.getElementById('metric-nexora');
const metricNexora = document.getElementById('metric-nexora');

const adminStatusWebsite = document.getElementById('admin-status-website');
const adminStatusRegistration = document.getElementById('admin-status-registration');
const adminStatusEmergency = document.getElementById('admin-status-emergency');
const btnToggleWebsite = document.getElementById('btn-toggle-website');
const btnToggleRegistration = document.getElementById('btn-toggle-registration');
const btnToggleEmergency = document.getElementById('btn-toggle-emergency');
const adminEmergencyUrlInput = document.getElementById('admin-emergency-url');
const btnSaveEmergencyUrl = document.getElementById('btn-save-emergency-url');

// Modal Elements
const detailModal = document.getElementById('participant-detail-modal');
const detailCloseBtn = document.getElementById('detail-modal-close');
const detailViewPassBtn = document.getElementById('detail-view-pass-btn');

const passPreviewModal = document.getElementById('admin-pass-preview-modal');
const passCloseBtn = document.getElementById('admin-pass-close-btn');

// Initialize Admin UI
function initAdmin() {
  // Check URL query parameters for pre-supplied secret
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const urlSecret = urlParams.get('secret') || urlParams.get('adminSecret') || urlParams.get('key');
    if (urlSecret && urlSecret.trim()) {
      adminSecret = urlSecret.trim();
      sessionStorage.setItem('exousia_admin_secret', adminSecret);
    }
  } catch (err) {
    console.warn('URL query parameter parsing notice:', err);
  }

  if (secretInput) {
    if (adminSecret) {
      secretInput.value = adminSecret;
    }
    secretInput.addEventListener('input', () => {
      adminSecret = secretInput.value.trim();
      if (adminSecret) {
        sessionStorage.setItem('exousia_admin_secret', adminSecret);
      } else {
        sessionStorage.removeItem('exousia_admin_secret');
      }
    });
  }

  // Toggle secret visibility
  if (toggleSecretBtn && secretInput) {
    toggleSecretBtn.addEventListener('click', () => {
      const type = secretInput.getAttribute('type') === 'password' ? 'text' : 'password';
      secretInput.setAttribute('type', type);
      const icon = toggleSecretBtn.querySelector('span');
      if (icon) icon.textContent = type === 'password' ? 'visibility' : 'visibility_off';
    });
  }

  // Authenticate button
  if (authBtn && secretInput) {
    authBtn.addEventListener('click', () => {
      adminSecret = secretInput.value.trim();
      if (adminSecret) {
        sessionStorage.setItem('exousia_admin_secret', adminSecret);
      } else {
        sessionStorage.removeItem('exousia_admin_secret');
      }
      currentPage = 1;
      fetchRegistrations();
    });

    secretInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        adminSecret = secretInput.value.trim();
        if (adminSecret) {
          sessionStorage.setItem('exousia_admin_secret', adminSecret);
        } else {
          sessionStorage.removeItem('exousia_admin_secret');
        }
        currentPage = 1;
        fetchRegistrations();
      }
    });
  }

  // Explicit Logout / Clear Secret Action Button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      adminSecret = '';
      sessionStorage.removeItem('exousia_admin_secret');
      if (secretInput) secretInput.value = '';
      logoutBtn.classList.add('hidden');
      currentPage = 1;
      fetchRegistrations();
    });
  }

  // Refresh Data
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => fetchRegistrations());
  }

  // Filter Event Listeners
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        searchQuery = searchInput.value.trim();
        currentPage = 1;
        fetchRegistrations();
      }, 300);
    });
  }

  if (eventFilterSelect) {
    eventFilterSelect.addEventListener('change', () => {
      eventFilter = eventFilterSelect.value;
      currentPage = 1;
      fetchRegistrations();
    });
  }

  if (statusFilterSelect) {
    statusFilterSelect.addEventListener('change', () => {
      statusFilter = statusFilterSelect.value;
      currentPage = 1;
      fetchRegistrations();
    });
  }

  if (sortFilterSelect) {
    sortFilterSelect.addEventListener('change', () => {
      sortOrder = sortFilterSelect.value;
      currentPage = 1;
      fetchRegistrations();
    });
  }

  if (pageSizeFilterSelect) {
    pageSizeFilterSelect.addEventListener('change', () => {
      pageSize = parseInt(pageSizeFilterSelect.value, 10) || 25;
      currentPage = 1;
      fetchRegistrations();
    });
  }

  // Pagination Listeners
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        fetchRegistrations();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        fetchRegistrations();
      }
    });
  }

  // Detail Modal Close
  if (detailCloseBtn && detailModal) {
    detailCloseBtn.addEventListener('click', () => {
      detailModal.classList.remove('modal-open');
    });
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) detailModal.classList.remove('modal-open');
    });
  }

  // Pass Preview Modal Close
  if (passCloseBtn && passPreviewModal) {
    passCloseBtn.addEventListener('click', () => {
      passPreviewModal.classList.remove('modal-open');
    });
    passPreviewModal.addEventListener('click', (e) => {
      if (e.target === passPreviewModal) passPreviewModal.classList.remove('modal-open');
    });
  }

  if (detailViewPassBtn) {
    detailViewPassBtn.addEventListener('click', () => {
      if (currentDetailRecord) {
        detailModal.classList.remove('modal-open');
        openPassPreviewModal(currentDetailRecord);
      }
    });
  }

  // System Control Toggle Listeners
  if (btnToggleWebsite) {
    btnToggleWebsite.addEventListener('click', () => toggleSystemSetting('website'));
  }
  if (btnToggleRegistration) {
    btnToggleRegistration.addEventListener('click', () => toggleSystemSetting('registration'));
  }
  if (btnToggleEmergency) {
    btnToggleEmergency.addEventListener('click', () => toggleSystemSetting('emergency'));
  }
  if (btnSaveEmergencyUrl) {
    btnSaveEmergencyUrl.addEventListener('click', () => saveEmergencyUrl());
  }

  // Initial Fetch
  fetchRegistrations();
}

// Fetch Registrations from Protected API Endpoint
async function fetchRegistrations() {
  hideAllOverlays();
  if (stateLoading) stateLoading.classList.remove('hidden');

  // Dynamically sync adminSecret from input or sessionStorage
  if (secretInput && secretInput.value.trim()) {
    adminSecret = secretInput.value.trim();
    sessionStorage.setItem('exousia_admin_secret', adminSecret);
  } else if (!adminSecret) {
    adminSecret = sessionStorage.getItem('exousia_admin_secret') || '';
  }

  if (adminSecret) {
    loadSystemStatus();
  }

  if (!adminSecret) {
    if (stateLoading) stateLoading.classList.add('hidden');
    if (stateUnauthorized) stateUnauthorized.classList.remove('hidden');
    if (logoutBtn) logoutBtn.classList.add('hidden');
    if (statusBadge) {
      statusBadge.textContent = 'AUTH REQUIRED';
      statusBadge.className = 'font-label-mono text-[10px] px-2.5 py-1 rounded-md bg-[#251618] border border-primary/30 text-primary uppercase tracking-wider whitespace-nowrap';
    }
    updateMetrics({ unavailable: true });
    renderTableRows([]);
    updatePaginationUI(0, 0, 1, 0);
    return;
  }

  try {
    const params = new URLSearchParams({
      page: String(currentPage),
      pageSize: String(pageSize),
      event: eventFilter,
      status: statusFilter,
      sort: sortOrder,
      secret: adminSecret
    });

    if (searchQuery) {
      params.set('search', searchQuery);
    }

    const response = await fetch(`/api/admin/registrations?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${adminSecret}`,
        'X-Admin-Secret': adminSecret
      }
    });

    const resData = await response.json().catch(() => ({}));

    if (stateLoading) stateLoading.classList.add('hidden');

    if (response.status === 401) {
      if (stateUnauthorized) stateUnauthorized.classList.remove('hidden');
      if (logoutBtn) logoutBtn.classList.add('hidden');
      if (statusBadge) {
        statusBadge.textContent = 'UNAUTHORIZED';
        statusBadge.className = 'font-label-mono text-[10px] px-2.5 py-1 rounded-md bg-[#251618] border border-red-500/40 text-red-400 uppercase tracking-wider whitespace-nowrap';
      }
      updateMetrics({ unavailable: true });
      renderTableRows([]);
      updatePaginationUI(0, 0, 1, 0);
      return;
    }

    if (!response.ok || !resData.success) {
      const msg = resData.message || 'REGISTRATION SERVICE OFFLINE';
      if (errorMsgEl) errorMsgEl.textContent = `[ FAILURE ]: ${msg}`;
      if (stateError) stateError.classList.remove('hidden');
      if (statusBadge) {
        statusBadge.textContent = 'SERVICE ERROR';
        statusBadge.className = 'font-label-mono text-[10px] px-2.5 py-1 rounded-md bg-[#251618] border border-red-500/40 text-red-400 uppercase tracking-wider whitespace-nowrap';
      }
      updateMetrics({ unavailable: true });
      renderTableRows([]);
      updatePaginationUI(0, 0, 1, 0);
      return;
    }

    // Success State
    if (logoutBtn) logoutBtn.classList.remove('hidden');
    if (statusBadge) {
      statusBadge.textContent = 'AUTHENTICATED';
      statusBadge.className = 'font-label-mono text-[10px] px-2.5 py-1 rounded-md bg-[#16251c] border border-emerald-500/40 text-emerald-400 uppercase tracking-wider whitespace-nowrap';
    }

    activeRecords = resData.records || [];
    totalRecords = resData.total || 0;
    totalPages = resData.totalPages || 0;

    if (resData.metrics) {
      updateMetrics(resData.metrics);
    }

    if (totalRecords === 0) {
      if (searchQuery || eventFilter !== 'ALL' || statusFilter !== 'ALL') {
        if (searchEmptyMsg) {
          searchEmptyMsg.textContent = `No participant records match search term "${searchQuery || 'active filter'}".`;
        }
        if (stateSearchEmpty) stateSearchEmpty.classList.remove('hidden');
      } else {
        if (stateEmpty) stateEmpty.classList.remove('hidden');
      }
      renderTableRows([]);
    } else {
      renderTableRows(activeRecords);
    }

    const startItem = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalRecords);
    updatePaginationUI(startItem, endItem, currentPage, totalPages, totalRecords);

  } catch (err) {
    console.error('Fetch Registrations Error:', err);
    if (stateLoading) stateLoading.classList.add('hidden');
    if (errorMsgEl) errorMsgEl.textContent = '[ ERROR ]: CONNECTION FAILED. ADMIN SERVICE UNREACHABLE.';
    if (stateError) stateError.classList.remove('hidden');
    if (statusBadge) {
      statusBadge.textContent = 'NETWORK ERROR';
      statusBadge.className = 'font-label-mono text-[10px] px-2.5 py-1 rounded-md bg-[#251618] border border-red-500/40 text-red-400 uppercase tracking-wider whitespace-nowrap';
    }
  }
}

// Render Table Rows
function renderTableRows(records) {
  if (!tableBody) return;
  tableBody.innerHTML = '';

  records.forEach(row => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-[#1f1618] transition-colors border-b border-outline-variant/20';

    const formattedDate = row.created_at
      ? new Date(row.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'N/A';

    tr.innerHTML = `
      <td class="py-3 px-4 text-primary font-bold tracking-wider select-text">${escapeHtml(row.registration_id)}</td>
      <td class="py-3 px-4 font-semibold text-on-surface select-text">${escapeHtml(row.full_name)}</td>
      <td class="py-3 px-4 text-on-surface-variant truncate max-w-[180px] select-text">${escapeHtml(row.college)}</td>
      <td class="py-3 px-4">
        <span class="inline-block font-label-mono text-[9px] px-2 py-0.5 rounded bg-surface-container border border-primary/30 text-primary uppercase tracking-wider">
          ${escapeHtml(row.selected_event)}
        </span>
      </td>
      <td class="py-3 px-4">
        <span class="inline-block font-label-mono text-[9px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-bold uppercase tracking-wider">
          ${escapeHtml(row.status || 'REGISTERED')}
        </span>
      </td>
      <td class="py-3 px-4 text-on-surface-variant text-[11px] whitespace-nowrap">${escapeHtml(formattedDate)}</td>
      <td class="py-3 px-4 text-right space-x-1 whitespace-nowrap">
        <button class="btn-terminal-secondary py-1 px-2.5 text-[10px] btn-detail-action" data-reg-id="${escapeHtml(row.registration_id)}">
          DETAILS
        </button>
        <button class="btn-terminal-primary py-1 px-2.5 text-[10px] btn-pass-action" data-reg-id="${escapeHtml(row.registration_id)}">
          PASS
        </button>
      </td>
    `;

    tableBody.appendChild(tr);
  });

  // Attach event handlers for Details and Pass actions
  document.querySelectorAll('.btn-detail-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const regId = btn.getAttribute('data-reg-id');
      const rec = records.find(r => r.registration_id === regId);
      if (rec) openDetailModal(rec);
    });
  });

  document.querySelectorAll('.btn-pass-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const regId = btn.getAttribute('data-reg-id');
      const rec = records.find(r => r.registration_id === regId);
      if (rec) openPassPreviewModal(rec);
    });
  });
}

// Open Participant Detail Inspection Modal
function openDetailModal(record) {
  currentDetailRecord = record;
  const nameEl = document.getElementById('detail-full-name');
  const collegeEl = document.getElementById('detail-college');
  const regIdEl = document.getElementById('detail-reg-id');
  const statusEl = document.getElementById('detail-status');
  const emailEl = document.getElementById('detail-email');
  const phoneEl = document.getElementById('detail-phone');
  const eventEl = document.getElementById('detail-event');
  const createdEl = document.getElementById('detail-created');
  const updatedEl = document.getElementById('detail-updated');
  const qrPayloadEl = document.getElementById('detail-qr-payload');

  if (nameEl) nameEl.textContent = (record.full_name || 'PARTICIPANT').toUpperCase();
  if (collegeEl) collegeEl.textContent = record.college || 'N/A';
  if (regIdEl) regIdEl.textContent = record.registration_id || 'N/A';
  if (statusEl) statusEl.textContent = record.status || 'REGISTERED';
  if (emailEl) emailEl.textContent = record.email || 'N/A';
  if (phoneEl) phoneEl.textContent = record.phone || 'N/A';
  if (eventEl) eventEl.textContent = record.selected_event || 'N/A';
  if (createdEl) createdEl.textContent = record.created_at ? new Date(record.created_at).toLocaleString() : 'N/A';
  if (updatedEl) updatedEl.textContent = record.updated_at ? new Date(record.updated_at).toLocaleString() : 'N/A';
  if (qrPayloadEl) qrPayloadEl.textContent = `EXOUSIA:${record.registration_id}`;

  if (detailModal) detailModal.classList.add('modal-open');
}

// Open Digital Pass Preview Modal
async function openPassPreviewModal(record) {
  const nameEl = document.getElementById('admin-pass-display-name');
  const collegeEl = document.getElementById('admin-pass-display-college');
  const regIdEl = document.getElementById('admin-pass-display-id');
  const trackEl = document.getElementById('admin-pass-display-track');
  const statusEl = document.getElementById('admin-pass-display-status');
  const dateEl = document.getElementById('admin-pass-display-date');

  if (nameEl) nameEl.textContent = (record.full_name || 'PARTICIPANT').toUpperCase();
  if (collegeEl) collegeEl.textContent = record.college || 'N/A';
  if (regIdEl) regIdEl.textContent = record.registration_id || 'N/A';
  if (trackEl) trackEl.textContent = record.selected_event || 'N/A';
  if (statusEl) statusEl.textContent = record.status || 'REGISTERED';

  if (dateEl) {
    const dateStr = record.created_at ? new Date(record.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'SEPT 2026';
    dateEl.textContent = `ISSUED: ${dateStr.toUpperCase()}`;
  }

  // Draw scannable QR verification code onto preview canvas
  const canvas = document.getElementById('admin-pass-qr-canvas');
  if (canvas) {
    try {
      const baseUrl = window.location.origin && window.location.origin !== 'null'
        ? window.location.origin
        : 'https://exousia-vert.vercel.app';
      const qrPayload = `${baseUrl}/verify?id=${encodeURIComponent(record.registration_id)}`;
      await QRCode.toCanvas(canvas, qrPayload, {
        width: 140,
        margin: 1,
        color: {
          dark: '#ffb4a8',
          light: '#181012'
        },
        errorCorrectionLevel: 'M'
      });
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', `QR verification code for registration ${record.registration_id}`);
    } catch (err) {
      console.error('Failed to generate admin preview QR code:', err);
    }
  }

  if (passPreviewModal) passPreviewModal.classList.add('modal-open');
}

// Update Operational Metrics Cards
function updateMetrics(metrics) {
  if (!metrics || metrics.unavailable) {
    if (metricTotal) metricTotal.textContent = 'UNAVAILABLE';
    if (metricCluedUp) metricCluedUp.textContent = '--';
    if (metricHawkins) metricHawkins.textContent = '--';
    if (metricDarkProtocol) metricDarkProtocol.textContent = '--';
    if (metricGenova) metricGenova.textContent = '--';
    if (metricNexora) metricNexora.textContent = '--';
    return;
  }
  if (metricTotal) metricTotal.textContent = (metrics.totalRegistrations ?? 0).toLocaleString();
  if (metricCluedUp) metricCluedUp.textContent = ((metrics.byEvent?.['CLUE\'D UP'] || 0) + (metrics.byEvent?.['CLUE\'D UP (DAY 1)'] || 0)).toLocaleString();
  if (metricHawkins) metricHawkins.textContent = ((metrics.byEvent?.['HAWKINS TRAP'] || 0) + (metrics.byEvent?.['HAWKINS TRAP (DAY 1)'] || 0)).toLocaleString();
  if (metricDarkProtocol) metricDarkProtocol.textContent = ((metrics.byEvent?.['DARK PORTAL'] || 0) + (metrics.byEvent?.['DARK PORTAL (DAY 2)'] || 0) + (metrics.byEvent?.['DARK PROTOCOL'] || 0) + (metrics.byEvent?.['DARK PROTOCOL (DAY 2)'] || 0)).toLocaleString();
  
  const genovaCount = (metrics.byEvent?.['GENOVA'] || 0) + (metrics.byEvent?.['GENOVA (DAY 2)'] || 0) + (metrics.byEvent?.['NEXORA'] || 0) + (metrics.byEvent?.['NEXORA (DAY 2)'] || 0);
  if (metricGenova) metricGenova.textContent = genovaCount.toLocaleString();
  if (metricNexora && metricNexora !== metricGenova) metricNexora.textContent = genovaCount.toLocaleString();
}

async function loadSystemStatus() {
  if (!adminSecret) return;
  try {
    const res = await fetch('/api/admin/settings', {
      headers: { 'Authorization': `Bearer ${adminSecret}` }
    });
    if (res.ok) {
      const data = await res.json();
      updateStatusUI(data.website_status, data.registration_status, data.emergency_mode, data.emergency_url);
    }
  } catch (err) {
    console.warn('Failed to load system status:', err);
  }
}

function updateStatusUI(webStatus, regStatus, emergMode, emergUrl) {
  if (adminStatusWebsite) {
    adminStatusWebsite.textContent = webStatus || 'ONLINE';
    adminStatusWebsite.className = webStatus === 'MAINTENANCE' ? 'font-bold text-amber-400' : 'font-bold text-emerald-400';
  }
  if (adminStatusRegistration) {
    adminStatusRegistration.textContent = regStatus || 'OPEN';
    adminStatusRegistration.className = regStatus === 'CLOSED' ? 'font-bold text-red-400' : 'font-bold text-emerald-400';
  }
  if (adminStatusEmergency) {
    adminStatusEmergency.textContent = emergMode || 'DISABLED';
    adminStatusEmergency.className = emergMode === 'ENABLED' ? 'font-bold text-amber-400' : 'font-bold text-emerald-400';
  }
  if (adminEmergencyUrlInput && emergUrl !== undefined) {
    adminEmergencyUrlInput.value = emergUrl || '';
  }
}

async function toggleSystemSetting(settingType) {
  if (!adminSecret) return;
  const currentWeb = adminStatusWebsite ? adminStatusWebsite.textContent : 'ONLINE';
  const currentReg = adminStatusRegistration ? adminStatusRegistration.textContent : 'OPEN';
  const currentEmerg = adminStatusEmergency ? adminStatusEmergency.textContent : 'DISABLED';

  const newWeb = settingType === 'website' ? (currentWeb === 'ONLINE' ? 'MAINTENANCE' : 'ONLINE') : currentWeb;
  const newReg = settingType === 'registration' ? (currentReg === 'OPEN' ? 'CLOSED' : 'OPEN') : currentReg;
  const newEmerg = settingType === 'emergency' ? (currentEmerg === 'DISABLED' ? 'ENABLED' : 'DISABLED') : currentEmerg;

  try {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        website_status: newWeb,
        registration_status: newReg,
        emergency_mode: newEmerg
      })
    });

    if (res.ok) {
      const data = await res.json();
      updateStatusUI(data.website_status, data.registration_status, data.emergency_mode, data.emergency_url);
    } else {
      alert('Failed to update system setting.');
    }
  } catch (err) {
    console.error('Toggle setting error:', err);
    alert('Error connecting to admin settings server.');
  }
}

async function saveEmergencyUrl() {
  if (!adminSecret || !adminEmergencyUrlInput) return;
  const urlVal = adminEmergencyUrlInput.value.trim();
  try {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        emergency_url: urlVal
      })
    });

    if (res.ok) {
      alert('Emergency Registration URL saved successfully.');
    } else {
      alert('Failed to save Emergency Registration URL.');
    }
  } catch (err) {
    console.error('Save emergency URL error:', err);
    alert('Error saving Emergency Registration URL.');
  }
}

// Update Pagination UI
function updatePaginationUI(start, end, page, pages, total = 0) {
  if (paginationInfo) {
    paginationInfo.textContent = `Showing ${start}–${end} of ${total} registrations (Page ${page} of ${pages || 1})`;
  }

  if (prevBtn) {
    prevBtn.disabled = page <= 1;
  }

  if (nextBtn) {
    nextBtn.disabled = page >= pages || pages === 0;
  }
}

// Helper: Hide Overlay States
function hideAllOverlays() {
  if (stateLoading) stateLoading.classList.add('hidden');
  if (stateEmpty) stateEmpty.classList.add('hidden');
  if (stateSearchEmpty) stateSearchEmpty.classList.add('hidden');
  if (stateUnauthorized) stateUnauthorized.classList.add('hidden');
  if (stateError) stateError.classList.add('hidden');
}

// Helper: Escape HTML string to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initialize on DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdmin);
} else {
  initAdmin();
}
