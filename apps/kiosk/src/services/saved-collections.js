import { getCommunity } from './auth.js';
import { supabase } from './supabase.js';

let listeners = [];

/**
 * Save a collection for a user. Creates resident if needed, then inserts collection.
 * @param {{ email: string, firstName: string, lastName: string, phone: string }} userInfo
 * @param {Array} items - board items snapshot
 * @param {string} [collectionName] - optional name for the collection
 * @returns {Promise<object>} the saved record
 */
export async function saveCollection(userInfo, items, collectionName) {
  const community = getCommunity();
  if (!community) throw new Error('No community selected');

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

    if (insertErr) throw new Error('Failed to create resident: ' + insertErr.message);
    resident = newResident;
  }

  const itemsForDb = items.map(i => {
    const { featureImage, additionalImages, ...rest } = i;
    return rest;
  });

  const name = collectionName || `Collection — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const { data: collection, error: colErr } = await supabase
    .from('collections')
    .insert({
      resident_id: resident.id,
      community_id: community.id,
      name,
      items: itemsForDb,
      saved_at: new Date().toISOString(),
    })
    .select('id, name, saved_at')
    .single();

  if (colErr) throw new Error('Failed to save collection: ' + colErr.message);

  const record = {
    id: collection.id,
    email: userInfo.email.toLowerCase().trim(),
    firstName: userInfo.firstName.trim(),
    lastName: userInfo.lastName.trim(),
    phone: userInfo.phone.trim(),
    name: collection.name,
    savedAt: collection.saved_at,
    items,
  };

  notify();
  return record;
}

/**
 * Get all collections for a given email address.
 */
export async function getCollectionsByEmail(email) {
  const community = getCommunity();
  if (!community) return [];

  const key = email.toLowerCase().trim();

  const { data, error } = await supabase
    .from('collections')
    .select(`
      id, name, items, saved_at,
      residents!inner (email, first_name, last_name, phone)
    `)
    .eq('community_id', community.id)
    .eq('residents.email', key)
    .order('saved_at', { ascending: false });

  if (error || !data) return [];

  return data.map(c => ({
    id: c.id,
    name: c.name,
    email: c.residents.email,
    firstName: c.residents.first_name,
    lastName: c.residents.last_name,
    phone: c.residents.phone || '',
    savedAt: c.saved_at,
    items: c.items || [],
  }));
}

/**
 * Get a single collection by ID.
 */
export async function getCollectionById(id) {
  const { data, error } = await supabase
    .from('collections')
    .select(`
      id, name, items, saved_at,
      residents (email, first_name, last_name, phone)
    `)
    .eq('id', id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    email: data.residents.email,
    firstName: data.residents.first_name,
    lastName: data.residents.last_name,
    phone: data.residents.phone || '',
    savedAt: data.saved_at,
    items: data.items || [],
  };
}

/**
 * Get all collections grouped by email (for admin records view).
 */
export async function getCollectionsGroupedByUser() {
  const community = getCommunity();
  if (!community) return [];

  const { data, error } = await supabase
    .from('collections')
    .select(`
      id, name, items, saved_at,
      residents!inner (id, email, first_name, last_name, phone)
    `)
    .eq('community_id', community.id)
    .order('saved_at', { ascending: false });

  if (error || !data) return [];

  const grouped = {};
  for (const c of data) {
    const email = c.residents.email;
    if (!grouped[email]) {
      grouped[email] = {
        email,
        firstName: c.residents.first_name,
        lastName: c.residents.last_name,
        phone: c.residents.phone || '',
        collections: [],
      };
    }
    grouped[email].collections.push({
      id: c.id,
      name: c.name,
      email,
      firstName: c.residents.first_name,
      lastName: c.residents.last_name,
      phone: c.residents.phone || '',
      savedAt: c.saved_at,
      items: c.items || [],
    });
  }

  return Object.values(grouped).sort((a, b) => a.lastName.localeCompare(b.lastName));
}

/**
 * Delete a single saved collection by ID.
 */
export async function deleteCollection(id) {
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id);

  if (error) console.error('Failed to delete collection:', error.message);
  notify();
}

export function onCollectionsChange(cb) {
  listeners.push(cb);
  return () => { listeners = listeners.filter(l => l !== cb); };
}

function notify() {
  listeners.forEach(cb => cb());
}
