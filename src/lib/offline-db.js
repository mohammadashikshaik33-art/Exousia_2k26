// IndexedDB Database Manager for EXOUSIA 2K26 Offline Capabilities
// SECURITY DIRECTIVE: Store ONLY minimal operational credential data.
// DO NOT store phone numbers, full email addresses, OTPs, Supabase keys, coordinator credentials, or secrets.

const DB_NAME = 'exousia_offline_db';
const DB_VERSION = 1;

export function openOfflineDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported in this browser environment'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      // Store 1: Participant Anomaly File Credentials
      if (!db.objectStoreNames.contains('participant_passes')) {
        db.createObjectStore('participant_passes', { keyPath: 'registration_id' });
      }

      // Store 2: Event-Scoped Coordinator Roster Snapshots
      if (!db.objectStoreNames.contains('coordinator_rosters')) {
        db.createObjectStore('coordinator_rosters', { keyPath: 'event' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// PARTICIPANT PASS OFFLINE STORAGE
export async function saveParticipantPassOffline(passData) {
  try {
    if (!passData || !passData.registration_id) return false;
    const db = await openOfflineDB();
    const tx = db.transaction('participant_passes', 'readwrite');
    const store = tx.objectStore('participant_passes');

    // Store strictly minimal non-sensitive credential data required to render Anomaly File
    const safeData = {
      registration_id: String(passData.registration_id).trim().toUpperCase(),
      full_name: String(passData.full_name || passData.primary_name || 'PARTICIPANT').trim().toUpperCase(),
      college: String(passData.college || passData.primary_college || 'INSTITUTION').trim().toUpperCase(),
      selected_event: String(passData.selected_event || passData.team_name || 'EXOUSIA EVENT').trim().toUpperCase(),
      created_at: passData.created_at || new Date().toISOString(),
      status: String(passData.status || 'CONFIRMED').trim().toUpperCase(),
      updated_at: Date.now()
    };

    store.put(safeData);
    return true;
  } catch (err) {
    console.warn('[OfflineDB] Failed to save participant pass offline:', err);
    return false;
  }
}

export async function getParticipantPassOffline(regId) {
  try {
    if (!regId) return null;
    const db = await openOfflineDB();
    const tx = db.transaction('participant_passes', 'readonly');
    const store = tx.objectStore('participant_passes');

    return new Promise((resolve) => {
      const req = store.get(String(regId).trim().toUpperCase());
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('[OfflineDB] Failed to read participant pass offline:', err);
    return null;
  }
}

// COORDINATOR EVENT ROSTER OFFLINE STORAGE (Strictly Event-Scoped)
export async function saveCoordinatorRosterOffline(eventTrack, records) {
  try {
    if (!eventTrack) return null;
    const db = await openOfflineDB();
    const tx = db.transaction('coordinator_rosters', 'readwrite');
    const store = tx.objectStore('coordinator_rosters');

    // Strip out all private fields (phone numbers, full emails, OTPs, etc.)
    const safeRecords = (Array.isArray(records) ? records : []).map(rec => ({
      registration_id: String(rec.registration_id || '').trim().toUpperCase(),
      full_name: String(rec.full_name || 'Participant').trim().toUpperCase(),
      college: String(rec.college || 'Institution').trim().toUpperCase(),
      selected_event: String(rec.selected_event || eventTrack).trim().toUpperCase(),
      created_at: rec.created_at || '',
      status: String(rec.status || 'CONFIRMED').trim().toUpperCase()
    }));

    const snapshot = {
      event: String(eventTrack).trim(),
      event_display_name: String(eventTrack).trim(),
      synced_at: new Date().toISOString(),
      synced_timestamp: Date.now(),
      total_count: safeRecords.length,
      records: safeRecords
    };

    store.put(snapshot);
    return snapshot;
  } catch (err) {
    console.warn('[OfflineDB] Failed to save coordinator roster offline:', err);
    return null;
  }
}

export async function getCoordinatorRosterOffline(eventTrack) {
  try {
    if (!eventTrack) return null;
    const db = await openOfflineDB();
    const tx = db.transaction('coordinator_rosters', 'readonly');
    const store = tx.objectStore('coordinator_rosters');

    return new Promise((resolve) => {
      const req = store.get(String(eventTrack).trim());
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('[OfflineDB] Failed to read coordinator roster offline:', err);
    return null;
  }
}
