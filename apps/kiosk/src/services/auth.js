import { COMMUNITIES, updateCommunityInList } from '../data/communities.js';
import { supabase } from './supabase.js';

const STORAGE_KEY = 'seniorstudio_community';
const ROLE_KEY = 'seniorstudio_role';

let currentCommunity = null;
let currentRole = 'user';
let onChangeCallback = null;

export function initAuth() {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored) {
    currentCommunity = COMMUNITIES.find(c => c.id === stored) || null;
  }
  currentRole = sessionStorage.getItem(ROLE_KEY) || 'user';
}

export function getCommunity() {
  return currentCommunity;
}

export function isAdmin() {
  return currentRole === 'admin';
}

export async function validateCommunityCode(code) {
  const { data, error } = await supabase
    .from('communities')
    .select('id, name, location, icon, units, accent, community_code')
    .eq('community_code', code.toUpperCase())
    .single();

  if (error || !data) return null;
  return data;
}

export function loginToCommunity(communityOrId, role = 'user') {
  if (typeof communityOrId === 'object' && communityOrId !== null) {
    currentCommunity = communityOrId;
  } else {
    currentCommunity = COMMUNITIES.find(c => c.id === communityOrId) || null;
  }
  currentRole = role;
  if (currentCommunity) {
    sessionStorage.setItem(STORAGE_KEY, currentCommunity.id);
    sessionStorage.setItem(ROLE_KEY, role);
  }
  if (onChangeCallback) onChangeCallback();
}

export async function validateAdminPin(pin) {
  if (!currentCommunity) return false;
  const { data, error } = await supabase
    .from('communities')
    .select('admin_pin')
    .eq('id', currentCommunity.id)
    .single();
  if (error || !data) return false;
  return data.admin_pin === pin;
}

export function elevateToAdmin() {
  currentRole = 'admin';
  sessionStorage.setItem(ROLE_KEY, 'admin');
  if (onChangeCallback) onChangeCallback();
}

export function logout() {
  currentCommunity = null;
  currentRole = 'user';
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(ROLE_KEY);
  if (onChangeCallback) onChangeCallback();
}

export function updateCommunityName(name) {
  if (!currentCommunity) return;
  currentCommunity.name = name;
  updateCommunityInList(currentCommunity.id, { name });
}

export function updateCommunityField(field, value) {
  if (!currentCommunity) return;
  currentCommunity[field] = value;
  updateCommunityInList(currentCommunity.id, { [field]: value });
}

export function onAuthChange(cb) {
  onChangeCallback = cb;
}
