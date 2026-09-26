// EXOUSIA Verification Desk Module
// Real browser-compatible WebRTC camera QR scanner & manual registration verification

import jsQR from 'jsqr';

// Mode tabs & view containers
const tabCameraMode = document.getElementById('tab-camera-mode');
const tabManualMode = document.getElementById('tab-manual-mode');
const scannerSection = document.getElementById('scanner-section');
const manualSection = document.getElementById('manual-section');

// Camera scanner elements
const scannerVideo = document.getElementById('scanner-video');
const scannerCanvas = document.getElementById('scanner-canvas');
const scannerPlaceholder = document.getElementById('scanner-placeholder');
const scannerOverlay = document.getElementById('scanner-overlay');
const scannerFrameBox = document.getElementById('scanner-frame-box');
const scannerLockBadge = document.getElementById('scanner-lock-badge');
const phaseInversionFlash = document.getElementById('phase-inversion-flash');

const btnStartCamera = document.getElementById('btn-start-camera');
const btnStopCamera = document.getElementById('btn-stop-camera');
const btnFallbackManual = document.getElementById('btn-fallback-manual');
const btnErrorManualFallback = document.getElementById('btn-error-manual-fallback');
const cameraErrorNotice = document.getElementById('camera-error-notice');

// Manual form elements
const verifyForm = document.getElementById('verify-form');
const verifyInput = document.getElementById('verify-input');
const verifySubmitBtn = document.getElementById('verify-submit-btn');

// Verification result state containers
const statePrompt = document.getElementById('state-prompt');
const stateLoading = document.getElementById('state-loading');
const stateValid = document.getElementById('state-valid');
const stateNotFound = document.getElementById('state-not-found');
const stateInvalidFormat = document.getElementById('state-invalid-format');
const stateError = document.getElementById('state-error');

// Result fields
const resValidName = document.getElementById('res-valid-name');
const resValidId = document.getElementById('res-valid-id');
const resValidCollege = document.getElementById('res-valid-college');
const resValidEvent = document.getElementById('res-valid-event');

const resNotFoundMsg = document.getElementById('res-not-found-msg');
const resInvalidMsg = document.getElementById('res-invalid-msg');
const resErrorMsg = document.getElementById('res-error-msg');

// "Scan Another" buttons
const btnScanAnotherValid = document.getElementById('btn-scan-another-valid');
const btnScanAnotherNotFound = document.getElementById('btn-scan-another-not-found');
const btnScanAnotherInvalidFormat = document.getElementById('btn-scan-another-invalid-format');
const btnScanAnotherError = document.getElementById('btn-scan-another-error');

// Camera state variables
let mediaStream = null;
let animFrameId = null;
let isScanning = false;
let isProcessingScan = false;
let activeMode = 'camera'; // 'camera' or 'manual'

function hideAllStates() {
  if (statePrompt) statePrompt.classList.add('hidden');
  if (stateLoading) stateLoading.classList.add('hidden');
  if (stateValid) stateValid.classList.add('hidden');
  if (stateNotFound) stateNotFound.classList.add('hidden');
  if (stateInvalidFormat) stateInvalidFormat.classList.add('hidden');
  if (stateError) stateError.classList.add('hidden');
}

/**
 * Universal payload parser supporting:
 * 1. New EXOUSIA Verification URL: https://exousia-vert.vercel.app/verify?id=EX-2026-4C6RJF
 * 2. Legacy QR Payload: EXOUSIA:EX-2026-4C6RJF
 * 3. Direct ID Payload: EX-2026-4C6RJF
 */
function extractRegistrationId(rawInput) {
  if (!rawInput) return '';
  let str = String(rawInput).trim();

  // Try parsing as URL or URL path with ?id=
  try {
    if (str.includes('?') && (str.includes('id=') || str.includes('verify'))) {
      const urlObj = new URL(str, window.location.origin);
      const idParam = urlObj.searchParams.get('id');
      if (idParam) return idParam.trim();
    }
  } catch (e) {
    // Ignore URL parse error
  }

  // Regex fallback for ?id= query param
  const matchIdParam = str.match(/[?&]id=([^&]+)/i);
  if (matchIdParam && matchIdParam[1]) {
    return decodeURIComponent(matchIdParam[1]).trim();
  }

  // Check legacy prefix "EXOUSIA:"
  if (str.toUpperCase().startsWith('EXOUSIA:')) {
    return str.substring(8).trim();
  }

  return str;
}

function switchMode(mode) {
  activeMode = mode;
  if (mode === 'camera') {
    if (scannerSection) scannerSection.classList.remove('hidden');
    if (manualSection) manualSection.classList.add('hidden');

    if (tabCameraMode) {
      tabCameraMode.className = 'px-4 py-2.5 rounded-lg bg-primary/20 text-primary border border-primary/50 font-bold transition-all flex items-center gap-1.5 cursor-pointer';
    }
    if (tabManualMode) {
      tabManualMode.className = 'px-4 py-2.5 rounded-lg bg-[#140e0f] text-on-surface-variant border border-outline-variant/40 hover:text-primary transition-all flex items-center gap-1.5 cursor-pointer';
    }
  } else {
    if (manualSection) manualSection.classList.remove('hidden');
    if (scannerSection) scannerSection.classList.add('hidden');

    if (tabManualMode) {
      tabManualMode.className = 'px-4 py-2.5 rounded-lg bg-primary/20 text-primary border border-primary/50 font-bold transition-all flex items-center gap-1.5 cursor-pointer';
    }
    if (tabCameraMode) {
      tabCameraMode.className = 'px-4 py-2.5 rounded-lg bg-[#140e0f] text-on-surface-variant border border-outline-variant/40 hover:text-primary transition-all flex items-center gap-1.5 cursor-pointer';
    }

    stopCamera();
    if (verifyInput) verifyInput.focus();
  }
}

async function startCamera() {
  if (isScanning) return;
  hideAllStates();
  if (statePrompt) statePrompt.classList.remove('hidden');
  if (cameraErrorNotice) cameraErrorNotice.classList.add('hidden');

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('MediaDevices API not available in this environment.');
    }

    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } }
    });

    if (scannerVideo) {
      scannerVideo.srcObject = mediaStream;
      scannerVideo.setAttribute('playsinline', true);
      scannerVideo.classList.remove('hidden');
      await scannerVideo.play();
    }

    if (scannerOverlay) scannerOverlay.classList.remove('hidden');
    if (scannerPlaceholder) scannerPlaceholder.classList.add('hidden');
    if (btnStartCamera) btnStartCamera.classList.add('hidden');
    if (btnStopCamera) btnStopCamera.classList.remove('hidden');

    isScanning = true;
    isProcessingScan = false;
    animFrameId = requestAnimationFrame(tickScan);

  } catch (err) {
    console.warn('Camera Access Error:', err);
    stopCamera();
    if (cameraErrorNotice) cameraErrorNotice.classList.remove('hidden');
    if (btnStartCamera) btnStartCamera.classList.remove('hidden');
    if (btnStopCamera) btnStopCamera.classList.add('hidden');
  }
}

function stopCamera() {
  isScanning = false;
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
  if (scannerVideo) {
    scannerVideo.srcObject = null;
    scannerVideo.classList.add('hidden');
  }
  if (scannerOverlay) scannerOverlay.classList.add('hidden');
  if (scannerPlaceholder) scannerPlaceholder.classList.remove('hidden');
  if (btnStartCamera) btnStartCamera.classList.remove('hidden');
  if (btnStopCamera) btnStopCamera.classList.add('hidden');
}

function tickScan() {
  if (!isScanning || isProcessingScan) return;

  if (scannerVideo && scannerVideo.readyState === scannerVideo.HAVE_ENOUGH_DATA) {
    if (scannerCanvas) {
      scannerCanvas.height = scannerVideo.videoHeight;
      scannerCanvas.width = scannerVideo.videoWidth;
      const ctx = scannerCanvas.getContext('2d');
      ctx.drawImage(scannerVideo, 0, 0, scannerCanvas.width, scannerCanvas.height);

      const imageData = ctx.getImageData(0, 0, scannerCanvas.width, scannerCanvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        const regId = extractRegistrationId(code.data);

        if (regId) {
          isProcessingScan = true;
          playCinematicLockAnimation(regId);
          return;
        }
      }
    }
  }

  if (isScanning) {
    animFrameId = requestAnimationFrame(tickScan);
  }
}

/**
 * Fast (~0.8s - 1.2s) Cinematic Stranger Things x EEE Phase Inversion QR Lock Animation:
 * Step 1: Lock frame onto QR & display "LOCKED // PHASE INVERSION"
 * Step 2: Pull / Zoom scaling effect
 * Step 3: Crimson Phase Inversion Flash
 * Step 4: Perform verification API lookup & display result card
 */
function playCinematicLockAnimation(regId) {
  if (scannerFrameBox) {
    scannerFrameBox.style.transform = 'scale(1.08)';
    scannerFrameBox.style.borderColor = '#ffb4a8';
    scannerFrameBox.style.boxShadow = '0 0 30px rgba(255, 180, 168, 0.8)';
  }
  if (scannerLockBadge) {
    scannerLockBadge.classList.remove('hidden');
  }

  setTimeout(() => {
    // Step 2 & 3: Phase Inversion Pull / Flash
    if (phaseInversionFlash) {
      phaseInversionFlash.style.opacity = '0.9';
    }

    setTimeout(() => {
      if (phaseInversionFlash) phaseInversionFlash.style.opacity = '0';
      if (scannerFrameBox) {
        scannerFrameBox.style.transform = 'scale(1)';
        scannerFrameBox.style.borderColor = '';
        scannerFrameBox.style.boxShadow = '';
      }
      if (scannerLockBadge) {
        scannerLockBadge.classList.add('hidden');
      }

      stopCamera();
      performVerification(regId);
    }, 350);

  }, 450);
}

async function performVerification(rawInput) {
  if (!rawInput) return;

  const cleanedId = extractRegistrationId(rawInput);
  if (!cleanedId) return;

  hideAllStates();
  if (stateLoading) stateLoading.classList.remove('hidden');

  if (verifySubmitBtn) {
    verifySubmitBtn.disabled = true;
    verifySubmitBtn.innerHTML = 'VERIFYING... <span class="material-symbols-outlined text-base animate-spin">sync</span>';
  }

  try {
    const response = await fetch(`/api/verify-registration?id=${encodeURIComponent(cleanedId)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    const resData = await response.json().catch(() => ({}));

    hideAllStates();

    if (response.status === 422) {
      if (resInvalidMsg) {
        resInvalidMsg.innerHTML = 'Registration not found.<br />Please ask the participant to register or show the correct QR code.';
      }
      if (stateInvalidFormat) stateInvalidFormat.classList.remove('hidden');
    } else if (!response.ok) {
      if (resErrorMsg) {
        resErrorMsg.textContent = resData.message || 'Verification service unconfigured or database unreachable.';
      }
      if (stateError) stateError.classList.remove('hidden');
    } else if (resData.success && resData.valid && resData.registration) {
      const reg = resData.registration;
      if (resValidName) resValidName.textContent = (reg.full_name || 'PARTICIPANT').toUpperCase();
      if (resValidId) resValidId.textContent = reg.registration_id || cleanedId;
      if (resValidCollege) resValidCollege.textContent = reg.college || 'N/A';
      let eventDisplay = reg.selected_event || 'N/A';
      if (eventDisplay.toUpperCase().includes('NEXORA')) {
        eventDisplay = 'GENOVA (DAY 2)';
      }
      if (resValidEvent) resValidEvent.textContent = eventDisplay;
      if (stateValid) stateValid.classList.remove('hidden');
    } else {
      if (resNotFoundMsg) {
        resNotFoundMsg.innerHTML = 'Registration not found.<br />Please ask the participant to register or show the correct QR code.';
      }
      if (stateNotFound) stateNotFound.classList.remove('hidden');
    }

  } catch (err) {
    console.error('Verification Request Error:', err);
    hideAllStates();
    if (resErrorMsg) {
      resErrorMsg.textContent = '[ ERROR ]: CONNECTION FAILED. VERIFICATION SERVICE UNREACHABLE.';
    }
    if (stateError) stateError.classList.remove('hidden');
  } finally {
    if (verifySubmitBtn) {
      verifySubmitBtn.disabled = false;
      verifySubmitBtn.innerHTML = '<span class="material-symbols-outlined text-base">verified</span> VERIFY CREDENTIAL';
    }
  }
}

function resetScanState() {
  isProcessingScan = false;
  hideAllStates();
  if (statePrompt) statePrompt.classList.remove('hidden');

  if (activeMode === 'camera') {
    startCamera();
  } else {
    if (verifyInput) {
      verifyInput.value = '';
      verifyInput.focus();
    }
  }
}

function initVerify() {
  // Mode Tab Listeners
  if (tabCameraMode) tabCameraMode.addEventListener('click', () => switchMode('camera'));
  if (tabManualMode) tabManualMode.addEventListener('click', () => switchMode('manual'));

  // Camera Control Listeners
  if (btnStartCamera) btnStartCamera.addEventListener('click', startCamera);
  if (btnStopCamera) btnStopCamera.addEventListener('click', stopCamera);

  // Manual Fallback Button Listeners
  if (btnFallbackManual) btnFallbackManual.addEventListener('click', () => switchMode('manual'));
  if (btnErrorManualFallback) btnErrorManualFallback.addEventListener('click', () => switchMode('manual'));

  // "Scan Another" Listeners
  if (btnScanAnotherValid) btnScanAnotherValid.addEventListener('click', resetScanState);
  if (btnScanAnotherNotFound) btnScanAnotherNotFound.addEventListener('click', resetScanState);
  if (btnScanAnotherInvalidFormat) btnScanAnotherInvalidFormat.addEventListener('click', resetScanState);
  if (btnScanAnotherError) btnScanAnotherError.addEventListener('click', resetScanState);

  // Manual Form Submission
  if (verifyForm && verifyInput) {
    verifyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const rawInput = verifyInput.value.trim();
      if (rawInput) {
        performVerification(rawInput);
      }
    });
  }

  // Check URL query parameters for direct QR URL opening (e.g. /verify?id=EX-2026-XXXXXX)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const queryId = urlParams.get('id');
    if (queryId) {
      const cleanedId = extractRegistrationId(queryId);
      if (cleanedId) {
        switchMode('manual');
        if (verifyInput) verifyInput.value = cleanedId;
        performVerification(cleanedId);
      }
    }
  } catch (err) {
    console.warn('Failed to parse URL query params:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVerify);
} else {
  initVerify();
}


