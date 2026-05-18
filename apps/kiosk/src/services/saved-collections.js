import { getCommunity } from './auth.js';
import { supabase } from './supabase.js';

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

async function syncToSupabase(userInfo, items, collectionName) {
  const community = getCommunity();
  if (!community) return;

  try {
    let { data: resident } = await supabase
      .from('residents')
      .select('id')
      .eq('email', userInfo.email.toLowerCase().trim())
      .eq('community_id', community.id)
      .single();

    if (!resident) {
      const { data: newResident, error: insertErr } = await supabase
        .from('residents')
        .insert({
          community_id: community.id,
          email: userInfo.email.toLowerCase().trim(),
          first_name: userInfo.firstName.trim(),
          last_name: userInfo.lastName.trim(),
          phone: userInfo.phone.trim() || null,
        })
        .select('id')
        .single();

      if (insertErr) {
        console.error('Failed to create resident:', insertErr.message);
        return;
      }
      resident = newResident;
    }

    const itemsForDb = items.map(i => {
      const { featureImage, additionalImages, ...rest } = i;
      return rest;
    });

    const { error: colErr } = await supabase
      .from('collections')
      .insert({
        resident_id: resident.id,
        community_id: community.id,
        name: collectionName || `Collection — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        items: itemsForDb,
        saved_at: new Date().toISOString(),
      });

    if (colErr) {
      console.error('Failed to save collection to Supabase:', colErr.message);
    }
  } catch (err) {
    console.error('Supabase sync error:', err);
  }
}

/**
 * Save a collection for a user.
 * @param {{ email: string, firstName: string, lastName: string, phone: string }} userInfo
 * @param {Array} items - board items snapshot
 * @param {string} [collectionName] - optional name for the collection
 * @returns {object} the saved record
 */
export function saveCollection(userInfo, items, collectionName) {
  const records = readAll();
  const record = {
    id: 'col_' + Date.now(),
    email: userInfo.email.toLowerCase().trim(),
    firstName: userInfo.firstName.trim(),
    lastName: userInfo.lastName.trim(),
    phone: userInfo.phone.trim(),
    name: collectionName || '',
    savedAt: new Date().toISOString(),
    items: items.map(i => ({ ...i })),
  };
  records.push(record);
  writeAll(records);
  notify();

  syncToSupabase(userInfo, items, collectionName);

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
    grouped[rec.email].firstName = rec.firstName || grouped[rec.email].firstName;
    grouped[rec.email].lastName = rec.lastName || grouped[rec.email].lastName;
    grouped[rec.email].phone = rec.phone || grouped[rec.email].phone;
    grouped[rec.email].collections.push(rec);
  }
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
