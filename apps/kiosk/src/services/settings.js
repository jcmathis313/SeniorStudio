import { CATEGORIES } from '../data/materials.js';
import { getCommunity, updateCommunityField } from './auth.js';
import { supabase } from './supabase.js';

let listeners = [];
let current = null;
let persistTimer = null;
const DEBOUNCE_MS = 800;

function seedCategories() {
  return CATEGORIES.map(c => ({
    id: c.id,
    label: c.label,
    icon: c.icon,
    filters: [...c.filters],
    items: c.items.map(i => ({ ...i })),
    enabled: true,
  }));
}

function defaultSettings() {
  return {
    categories: seedCategories(),
    floorPlans: [],
    logo: null,
    primaryColor: '#007aff',
  };
}

export async function loadSettings() {
  const community = getCommunity();
  if (!community) { current = defaultSettings(); return; }

  const primaryColor = community.accent || '#007aff';

  try {
    const [{ data }, { data: logoData }] = await Promise.all([
      supabase
        .from('community_settings')
        .select('settings')
        .eq('community_id', community.id)
        .single(),
      supabase
        .from('communities')
        .select('logo_url')
        .eq('id', community.id)
        .single(),
    ]);

    const logo = logoData?.logo_url || null;
    community.logo_url = logo;

    if (data?.settings) {
      const s = data.settings;
      current = {
        categories: s.categories || seedCategories(),
        floorPlans: s.floorPlans || [],
        logo,
        primaryColor,
      };
    } else {
      current = { ...defaultSettings(), logo, primaryColor };
    }
  } catch {
    current = { ...defaultSettings(), logo: community.logo_url || null, primaryColor };
  }

  applyBrandColor(current.primaryColor);
}

function migrateOldSettings(old) {
  const cats = seedCategories();
  if (old.enabledCategories) {
    cats.forEach(c => { c.enabled = old.enabledCategories.includes(c.id); });
  }
  if (old.customCategories) {
    for (const cc of old.customCategories) {
      cats.push({
        ...cc,
        items: old.customItems?.[cc.id] || [],
        enabled: old.enabledCategories?.includes(cc.id) ?? true,
      });
    }
  }
  return {
    categories: cats,
    floorPlans: old.floorPlans || [],
    logo: old.logo || null,
    primaryColor: old.primaryColor || '#007aff',
  };
}

export function getSettings() {
  if (!current) current = defaultSettings();
  return current;
}

export function updateSettings(patch) {
  Object.assign(current, patch);

  if (patch.primaryColor !== undefined) {
    applyBrandColor(patch.primaryColor);
    updateCommunityField('accent', patch.primaryColor);
    persistCommunityField('accent', patch.primaryColor);
  }
  if (patch.logo !== undefined) {
    updateCommunityField('logo_url', patch.logo);
    persistCommunityField('logo_url', patch.logo);
  }

  persistSettingsDebounced();
  notify();
}

function persistSettingsDebounced() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(persistSettings, DEBOUNCE_MS);
}

async function persistSettings() {
  const community = getCommunity();
  if (!community || !current) return;

  const payload = {
    categories: current.categories,
    floorPlans: current.floorPlans,
  };

  const { error } = await supabase
    .from('community_settings')
    .upsert({
      community_id: community.id,
      settings: payload,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Failed to persist settings:', error.message);
  }
}

async function persistCommunityField(column, value) {
  const community = getCommunity();
  if (!community) return;

  const { error } = await supabase
    .from('communities')
    .update({ [column]: value })
    .eq('id', community.id);

  if (error) {
    console.error(`Failed to update communities.${column}:`, error.message);
  }
}

export function getVisibleCategories() {
  return getSettings().categories.filter(c => c.enabled);
}

export function getAllCategories() {
  return getSettings().categories;
}

// ── Floor plan operations ──

export function getFloorPlans() {
  return getSettings().floorPlans;
}

export function addFloorPlan(name) {
  const id = 'fp_' + Date.now();
  const fp = { id, name, rooms: [] };
  current.floorPlans.push(fp);
  persistSettingsDebounced();
  notify();
  return fp;
}

export function updateFloorPlan(fpId, patch) {
  const fp = current.floorPlans.find(f => f.id === fpId);
  if (!fp) return;
  Object.assign(fp, patch);
  persistSettingsDebounced();
  notify();
}

export function removeFloorPlan(fpId) {
  current.floorPlans = current.floorPlans.filter(f => f.id !== fpId);
  persistSettingsDebounced();
  notify();
}

export function addRoomToFloorPlan(fpId, name, sqft) {
  const fp = current.floorPlans.find(f => f.id === fpId);
  if (!fp) return;
  const id = 'room_' + Date.now();
  const room = { id, name, sqft: sqft || 0 };
  fp.rooms.push(room);
  persistSettingsDebounced();
  notify();
  return room;
}

export function updateRoomInFloorPlan(fpId, roomId, patch) {
  const fp = current.floorPlans.find(f => f.id === fpId);
  if (!fp) return;
  const room = fp.rooms.find(r => r.id === roomId);
  if (!room) return;
  Object.assign(room, patch);
  persistSettingsDebounced();
  notify();
}

export function removeRoomFromFloorPlan(fpId, roomId) {
  const fp = current.floorPlans.find(f => f.id === fpId);
  if (!fp) return;
  fp.rooms = fp.rooms.filter(r => r.id !== roomId);
  persistSettingsDebounced();
  notify();
}

// ── Category operations ──

export function addCategory(label) {
  const id = 'cat_' + Date.now();
  const cat = { id, label, icon: '◆', filters: ['All'], items: [], enabled: true };
  current.categories.push(cat);
  persistSettingsDebounced();
  notify();
  return cat;
}

export function updateCategory(catId, patch) {
  const cat = current.categories.find(c => c.id === catId);
  if (!cat) return;
  Object.assign(cat, patch);
  persistSettingsDebounced();
  notify();
}

export function removeCategory(catId) {
  current.categories = current.categories.filter(c => c.id !== catId);
  persistSettingsDebounced();
  notify();
}

export function setCategoryEnabled(catId, enabled) {
  const cat = current.categories.find(c => c.id === catId);
  if (!cat) return;
  cat.enabled = enabled;
  persistSettingsDebounced();
  notify();
}

// ── Item operations ──

export function addItem(catId, item) {
  const cat = current.categories.find(c => c.id === catId);
  if (!cat) return;
  cat.items.push(item);
  rebuildFilters(cat);
  persistSettingsDebounced();
  notify();
}

export function updateItem(catId, sku, patch) {
  const cat = current.categories.find(c => c.id === catId);
  if (!cat) return;
  const item = cat.items.find(i => i.sku === sku);
  if (!item) return;
  Object.assign(item, patch);
  rebuildFilters(cat);
  persistSettingsDebounced();
  notify();
}

export function removeItem(catId, sku) {
  const cat = current.categories.find(c => c.id === catId);
  if (!cat) return;
  cat.items = cat.items.filter(i => i.sku !== sku);
  rebuildFilters(cat);
  persistSettingsDebounced();
  notify();
}

function rebuildFilters(cat) {
  const types = new Set(cat.items.map(i => i.type).filter(Boolean));
  cat.filters = ['All', ...types];
}

// ── Listeners ──

export function onSettingsChange(cb) {
  listeners.push(cb);
  return () => { listeners = listeners.filter(l => l !== cb); };
}

function notify() {
  listeners.forEach(cb => cb());
}

function applyBrandColor(hex) {
  document.documentElement.style.setProperty('--blue', hex);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  document.documentElement.style.setProperty('--blue-dim', `rgba(${r},${g},${b},0.10)`);
}
