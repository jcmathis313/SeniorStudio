import { CATEGORIES } from '../data/materials.js';
import { getCommunity } from './auth.js';

let listeners = [];
let current = null;

function storageKey() {
  const c = getCommunity();
  return c ? `seniorstudio_settings_${c.id}` : null;
}

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

export function loadSettings() {
  const key = storageKey();
  if (!key) { current = defaultSettings(); return; }
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.categories) {
        current = { ...defaultSettings(), ...parsed };
      } else {
        current = migrateOldSettings(parsed);
      }
      compressExistingImages();
    } else {
      current = defaultSettings();
    }
  } catch {
    current = defaultSettings();
  }
  applyBrandColor(current.primaryColor);
}

function compressExistingImages() {
  const MAX_LEN = 50000;
  let dirty = false;
  function shrink(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        const scale = 400 / Math.max(w, h);
        if (scale < 1) { w = Math.round(w * scale); h = Math.round(h * scale); }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }
  const jobs = [];
  for (const cat of current.categories) {
    for (const item of cat.items) {
      if (item.featureImage && item.featureImage.length > MAX_LEN) {
        jobs.push(shrink(item.featureImage).then(r => { item.featureImage = r; dirty = true; }));
      }
      if (item.additionalImages) {
        item.additionalImages.forEach((img, i) => {
          if (img && img.length > MAX_LEN) {
            jobs.push(shrink(img).then(r => { item.additionalImages[i] = r; dirty = true; }));
          }
        });
      }
    }
  }
  if (current.logo && current.logo.length > MAX_LEN) {
    jobs.push(shrink(current.logo).then(r => { current.logo = r; dirty = true; }));
  }
  if (jobs.length > 0) {
    Promise.all(jobs).then(() => { if (dirty) persist(); });
  }
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
  if (!current) loadSettings();
  return current;
}

export function updateSettings(patch) {
  Object.assign(current, patch);
  persist();
  if (patch.primaryColor) applyBrandColor(patch.primaryColor);
  notify();
}

function persist() {
  const key = storageKey();
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(current));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      const lite = JSON.parse(JSON.stringify(current));
      for (const cat of lite.categories) {
        for (const item of cat.items) {
          delete item.featureImage;
          delete item.additionalImages;
        }
      }
      delete lite.logo;
      try { localStorage.setItem(key, JSON.stringify(lite)); } catch { /* give up */ }
      console.warn('Storage quota exceeded — images were dropped from this save. Compress or remove large images in Settings.');
    }
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
  persist();
  notify();
  return fp;
}

export function updateFloorPlan(fpId, patch) {
  const fp = current.floorPlans.find(f => f.id === fpId);
  if (!fp) return;
  Object.assign(fp, patch);
  persist();
  notify();
}

export function removeFloorPlan(fpId) {
  current.floorPlans = current.floorPlans.filter(f => f.id !== fpId);
  persist();
  notify();
}

export function addRoomToFloorPlan(fpId, name, sqft) {
  const fp = current.floorPlans.find(f => f.id === fpId);
  if (!fp) return;
  const id = 'room_' + Date.now();
  const room = { id, name, sqft: sqft || 0 };
  fp.rooms.push(room);
  persist();
  notify();
  return room;
}

export function updateRoomInFloorPlan(fpId, roomId, patch) {
  const fp = current.floorPlans.find(f => f.id === fpId);
  if (!fp) return;
  const room = fp.rooms.find(r => r.id === roomId);
  if (!room) return;
  Object.assign(room, patch);
  persist();
  notify();
}

export function removeRoomFromFloorPlan(fpId, roomId) {
  const fp = current.floorPlans.find(f => f.id === fpId);
  if (!fp) return;
  fp.rooms = fp.rooms.filter(r => r.id !== roomId);
  persist();
  notify();
}

// ── Category operations ──

export function addCategory(label) {
  const id = 'cat_' + Date.now();
  const cat = { id, label, icon: '◆', filters: ['All'], items: [], enabled: true };
  current.categories.push(cat);
  persist();
  notify();
  return cat;
}

export function updateCategory(catId, patch) {
  const cat = current.categories.find(c => c.id === catId);
  if (!cat) return;
  Object.assign(cat, patch);
  persist();
  notify();
}

export function removeCategory(catId) {
  current.categories = current.categories.filter(c => c.id !== catId);
  persist();
  notify();
}

export function setCategoryEnabled(catId, enabled) {
  const cat = current.categories.find(c => c.id === catId);
  if (!cat) return;
  cat.enabled = enabled;
  persist();
  notify();
}

// ── Item operations ──

export function addItem(catId, item) {
  const cat = current.categories.find(c => c.id === catId);
  if (!cat) return;
  cat.items.push(item);
  rebuildFilters(cat);
  persist();
  notify();
}

export function updateItem(catId, sku, patch) {
  const cat = current.categories.find(c => c.id === catId);
  if (!cat) return;
  const item = cat.items.find(i => i.sku === sku);
  if (!item) return;
  Object.assign(item, patch);
  rebuildFilters(cat);
  persist();
  notify();
}

export function removeItem(catId, sku) {
  const cat = current.categories.find(c => c.id === catId);
  if (!cat) return;
  cat.items = cat.items.filter(i => i.sku !== sku);
  rebuildFilters(cat);
  persist();
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
