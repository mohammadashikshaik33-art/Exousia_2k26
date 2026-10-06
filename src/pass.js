import QRCode from 'qrcode';
import { saveParticipantPassOffline, getParticipantPassOffline } from './lib/offline-db.js';

// Register Service Worker for static PWA caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[PWA] Service Worker registration failed:', err);
    });
  });
}

// Deterministic FNV-1a String Hashing Algorithm
function hashString(str) {
  let hash = 2166136261;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash);
}

// Generate Procedural SVG Technical Background with Deterministic Anomaly Signature
function renderProceduralSvgBg(regId) {
  const seed = hashString(regId || 'EX-2026-DEFAULT');

  const nodeX1 = 120 + (seed % 340);
  const nodeY1 = 80 + ((seed >> 2) % 200);
  const nodeX2 = 500 + ((seed >> 4) % 400);
  const nodeY2 = 280 + ((seed >> 6) % 240);
  const nodeX3 = 900 + ((seed >> 8) % 300);
  const nodeY3 = 150 + ((seed >> 10) % 350);

  const freq = 0.02 + ((seed % 10) * 0.005);
  const amplitude = 15 + (seed % 25);

  let wavePath = `M 60 ${450 + Math.sin(0) * amplitude}`;
  for (let x = 60; x <= 1400; x += 40) {
    const y = 450 + Math.sin(x * freq + seed) * amplitude;
    wavePath += ` L ${x} ${y.toFixed(1)}`;
  }

  return `
<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="position: absolute; inset: 0; width: 100%; height: 100%;">
  <defs>
    <radialGradient id="bgGlow" cx="25%" cy="20%" r="70%">
      <stop offset="0%" stop-color="#E50914" stop-opacity="0.16"/>
      <stop offset="60%" stop-color="#050709" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#050709" stop-opacity="1"/>
    </radialGradient>

    <pattern id="techGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.035)" stroke-width="1"/>
      <circle cx="40" cy="40" r="1" fill="rgba(229, 9, 20, 0.25)"/>
    </pattern>

    <linearGradient id="traceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E50914" stop-opacity="0.6"/>
      <stop offset="50%" stop-color="#E50914" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#050709" stop-opacity="0.1"/>
    </linearGradient>
  </defs>

  <rect width="100%" height="100%" fill="url(#bgGlow)"/>
  <rect width="100%" height="100%" fill="url(#techGrid)"/>

  <path d="${wavePath}" fill="none" stroke="rgba(229, 9, 20, 0.2)" stroke-width="1.5" stroke-dasharray="4,4"/>

  <g fill="none" stroke="url(#traceGrad)" stroke-width="1.5" stroke-linecap="round">
    <path d="M ${nodeX1} ${nodeY1} L ${nodeX1 + 120} ${nodeY1} L ${nodeX1 + 180} ${nodeY1 + 60} L ${nodeX2} ${nodeY2}"/>
    <path d="M ${nodeX2} ${nodeY2} L ${nodeX2 + 150} ${nodeY2} L ${nodeX3} ${nodeY3}"/>
    <path d="M ${nodeX1 - 40} ${nodeY1 + 100} L ${nodeX1 + 60} ${nodeY1 + 100} L ${nodeX1 + 100} ${nodeY1 + 60}"/>
  </g>

  <g fill="#E50914">
    <circle cx="${nodeX1}" cy="${nodeY1}" r="3" opacity="0.8"/>
    <circle cx="${nodeX2}" cy="${nodeY2}" r="3.5" opacity="0.9"/>
    <circle cx="${nodeX3}" cy="${nodeY3}" r="3" opacity="0.8"/>
  </g>

  <text x="60" y="40" fill="rgba(141, 146, 154, 0.4)" font-family="monospace" font-size="9" letter-spacing="2">LAT: 16.4812° N // LONG: 80.5074° E</text>
  <text x="60" y="980" fill="rgba(229, 9, 20, 0.35)" font-family="monospace" font-size="9" letter-spacing="2">SIG_HASH // 0x${seed.toString(16).toUpperCase()}</text>
</svg>
  `.trim();
}

async function loadAnomalyDossier() {
  const loadingEl = document.getElementById('pass-state-loading');
  const errorEl = document.getElementById('pass-state-error');
  const dossierWrapperEl = document.getElementById('pass-dossier-wrapper');
  const errorMsgEl = document.getElementById('pass-error-msg');
  const offlineBadgeEl = document.getElementById('dossier-offline-badge');

  // 1. Extract Registration ID from URL query parameters (e.g. ?id=EX-2026-6LSTPW)
  const urlParams = new URLSearchParams(window.location.search);
  let regId = (urlParams.get('id') || urlParams.get('regCode') || urlParams.get('code') || '').trim().toUpperCase();

  let paramName = (urlParams.get('name') || '').trim();
  let paramCollege = (urlParams.get('college') || '').trim();
  let paramEvent = (urlParams.get('event') || urlParams.get('eventTrack') || '').trim();
  let paramDate = (urlParams.get('date') || '').trim();

  if (!regId) {
    loadingEl.classList.add('hidden');
    errorMsgEl.textContent = 'No Registration ID provided in URL parameters. Format must be ?id=EX-2026-XXXXXX.';
    errorEl.classList.remove('hidden');
    return;
  }

  if (!/^EX-2026-[A-Z0-9]{6}$/.test(regId)) {
    loadingEl.classList.add('hidden');
    errorMsgEl.textContent = `Invalid Registration ID format: ${regId}. Expected format EX-2026-XXXXXX.`;
    errorEl.classList.remove('hidden');
    return;
  }

  let record = null;
  let isLoadedOffline = false;

  // 2. Fetch authoritative verification telemetry from API if online
  if (navigator.onLine) {
    try {
      const res = await fetch(`/api/verify-registration?id=${encodeURIComponent(regId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.valid && data.registration) {
          record = data.registration;
          // Persist minimal credential data to IndexedDB for offline access
          saveParticipantPassOffline(record);
        }
      }
    } catch (err) {
      console.warn('Network lookup failed, attempting offline fallback:', err);
    }
  }

  // 3. Fallback to IndexedDB local offline record if network unavailable or fetch failed
  if (!record) {
    const offlineRecord = await getParticipantPassOffline(regId);
    if (offlineRecord) {
      record = offlineRecord;
      isLoadedOffline = true;
    }
  }

  // 4. Fallback to URL parameters if offline record is not found in IndexedDB
  if (!record) {
    if (paramName && paramCollege && paramEvent) {
      record = {
        registration_id: regId,
        full_name: paramName,
        college: paramCollege,
        selected_event: paramEvent,
        created_at: paramDate || new Date().toISOString()
      };
      saveParticipantPassOffline(record);
    } else {
      loadingEl.classList.add('hidden');
      if (!navigator.onLine) {
        errorMsgEl.textContent = `OFFLINE MODE — Anomaly File [${regId}] is not saved locally on this device. Please connect to the internet to load and save your credential for the first time.`;
      } else {
        errorMsgEl.textContent = `No verified registration record found for ${regId}. Please ensure the registration is confirmed.`;
      }
      errorEl.classList.remove('hidden');
      return;
    }
  }

  // Toggle Offline Badge Indicator
  if (offlineBadgeEl) {
    if (isLoadedOffline || !navigator.onLine) {
      offlineBadgeEl.classList.remove('hidden');
    } else {
      offlineBadgeEl.classList.add('hidden');
    }
  }

  // 5. Populate Dossier Data Fields
  const formattedId = String(record.registration_id || regId).toUpperCase();
  const formattedName = String(record.full_name || record.primary_name || 'PARTICIPANT').toUpperCase();
  const formattedCollege = String(record.college || record.primary_college || 'INSTITUTION').toUpperCase();
  const formattedEvent = String(record.selected_event || record.team_name || 'EXOUSIA EVENT').toUpperCase();

  let formattedDate = 'SEP 26, 2026';
  if (record.created_at) {
    try {
      const d = new Date(record.created_at);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
      }
    } catch (e) {}
  } else if (paramDate) {
    formattedDate = paramDate.toUpperCase();
  }

  // Update DOM text content
  document.getElementById('dossier-case-header-id').textContent = `CASE // ${formattedId}`;
  document.getElementById('dossier-case-id').textContent = formattedId;
  document.getElementById('dossier-subject-name').textContent = formattedName;
  document.getElementById('dossier-origin-college').textContent = formattedCollege;
  document.getElementById('dossier-assigned-event').textContent = formattedEvent;
  document.getElementById('dossier-registered-date').textContent = formattedDate;
  document.title = `EXOUSIA 2K26 — Anomaly File [${formattedId}]`;

  // Update event timing/venue indicator
  const timingEl = document.getElementById('dossier-event-timing');
  if (timingEl) {
    if (formattedEvent.includes('GENOVA') || formattedEvent.includes('NEXORA')) {
      timingEl.textContent = 'DAY 2 — OCT 01 (COMPUTER LAB)';
    } else if (formattedEvent.includes('DARK PROTOCOL') || formattedEvent.includes('DARK PORTAL')) {
      timingEl.textContent = 'DAY 2 — OCT 01 (LOYALTY – 3 BLOCK)';
    } else {
      timingEl.textContent = 'DAY 1 — SEP 30 (LOYALTY – 3 BLOCK)';
    }
  }

  // Auto-scale typography for long participant / college names
  const subjectNameEl = document.getElementById('dossier-subject-name');
  if (formattedName.length > 32) {
    subjectNameEl.style.fontSize = '1.25rem';
  } else if (formattedName.length > 22) {
    subjectNameEl.style.fontSize = '1.5rem';
  }

  const collegeEl = document.getElementById('dossier-origin-college');
  if (formattedCollege.length > 60) {
    collegeEl.style.fontSize = '0.75rem';
  }

  // 6. Render Dynamic Procedural Background
  const svgBgContainer = document.getElementById('dossier-svg-bg');
  if (svgBgContainer) {
    svgBgContainer.innerHTML = renderProceduralSvgBg(formattedId);
  }

  // 7. Render Dynamic QR Code (~220px x 220px)
  const qrCanvas = document.getElementById('dossier-qr-canvas');
  if (qrCanvas) {
    const verifyUrl = `https://exousia-vert.vercel.app/verify?id=${encodeURIComponent(formattedId)}`;
    try {
      await QRCode.toCanvas(qrCanvas, verifyUrl, {
        width: 220,
        margin: 1,
        color: {
          dark: '#050709',
          light: '#FFFFFF'
        }
      });
    } catch (qrErr) {
      console.error('QR code generation failed:', qrErr);
    }
  }

  // Show Dossier
  loadingEl.classList.add('hidden');
  dossierWrapperEl.classList.remove('hidden');
}

// Action Button & PWA Install Event Handlers
document.addEventListener('DOMContentLoaded', () => {
  loadAnomalyDossier();

  // Network transition listeners
  window.addEventListener('online', () => {
    loadAnomalyDossier();
  });
  window.addEventListener('offline', () => {
    const offlineBadgeEl = document.getElementById('dossier-offline-badge');
    if (offlineBadgeEl) offlineBadgeEl.classList.remove('hidden');
  });

  // PWA Install Prompt handling
  let deferredInstallPrompt = null;
  const installBtn = document.getElementById('btn-install-pwa');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (installBtn) installBtn.classList.remove('hidden');
  });

  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          installBtn.classList.add('hidden');
        }
        deferredInstallPrompt = null;
      }
    });
  }

  // Print button
  const printBtn = document.getElementById('btn-print-pass');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Copy link button
  const copyLinkBtn = document.getElementById('btn-copy-link');
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        const originalText = copyLinkBtn.innerHTML;
        copyLinkBtn.innerHTML = `<span class="material-symbols-outlined text-sm text-[#10B981]">check</span> COPIED!`;
        setTimeout(() => {
          copyLinkBtn.innerHTML = originalText;
        }, 2000);
      } catch (e) {
        alert(`Dossier URL: ${window.location.href}`);
      }
    });
  }
});
