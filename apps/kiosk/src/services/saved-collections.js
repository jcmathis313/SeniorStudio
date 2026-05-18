import { getCommunity } from './auth.js';

let listeners = [];

function storageKey() {
  const c = getCommunity();
  return c ? `seniorstudio_collections_${c.id}` : null;
}

function readAll() {
  const key = storageKey();
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(records) {
  const key = storageKey();
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(records));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      // Strip images and retry
      const lite = JSON.parse(JSON.stringify(records));
      for (const rec of lite) {
        for (const item of rec.items) {
          delete item.featureImage;
          delete item.additionalImages;
        }
      }
      try { localStorage.setItem(key, JSON.stringify(lite)); } catch { /* give up */ }
      console.warn('Storage quota exceeded — images were dropped from saved collections.');
    }
  }
}

/**
 * Save a collection for a user.
 * @param {{ email: string, firstName: string, lastName: string, phone: string }} userInfo
 * @param {Array} items - board items snapshot
 * @returns {object} the saved record
 */
export function saveCollection(userInfo, items) {
  const records = readAll();
  const record = {
    id: 'col_' + Date.now(),
    email: userInfo.email.toLowerCase().trim(),
    firstName: userInfo.firstName.trim(),
    lastName: userInfo.lastName.trim(),
    phone: userInfo.phone.trim(),
    savedAt: new Date().toISOString(),
    items: items.map(i => ({ ...i })),
  };
  records.push(record);
  writeAll(records);
  notify();
  return record;
}

/**
 * Get all collections for a given email address.
 */
export function getCollectionsByEmail(email) {
  const records = readAll();
  const key = email.toLowerCase().trim();
  return records.filter(r => r.email === key);
}

/**
 * Get a single collection by ID.
 */
export function getCollectionById(id) {
  return readAll().find(r => r.id === id) || null;
}

/**
 * Get all saved collections (for admin view).
 */
export function getAllCollections() {
  return readAll();
}

/**
 * Get all collections grouped by email (for admin records view).
 * Returns array of { email, firstName, lastName, phone, collections: [] }
 */
export function getCollectionsGroupedByUser() {
  const records = readAll();
  const grouped = {};
  for (const rec of records) {
    if (!grouped[rec.email]) {
      grouped[rec.email] = {
        email: rec.email,
        firstName: rec.firstName,
        lastName: rec.lastName,
        phone: rec.phone,
        collections: [],
      };
    }
    // Keep user info up to date with latest save
    grouped[rec.email].firstName = rec.firstName || grouped[rec.email].firstName;
    grouped[rec.email].lastName = rec.lastName || grouped[rec.email].lastName;
    grouped[rec.email].phone = rec.phone || grouped[rec.email].phone;
    grouped[rec.email].collections.push(rec);
  }
  // Sort collections by date descending within each user
  for (const user of Object.values(grouped)) {
    user.collections.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
  }
  return Object.values(grouped).sort((a, b) => a.lastName.localeCompare(b.lastName));
}

/**
 * Delete a single saved collection by ID.
 */
export function deleteCollection(id) {
  const records = readAll().filter(r => r.id !== id);
  writeAll(records);
  notify();
}

export function onCollectionsChange(cb) {
  listeners.push(cb);
  return () => { listeners = listeners.filter(l => l !== cb); };
}

function notify() {
  listeners.forEach(cb => cb());
}
