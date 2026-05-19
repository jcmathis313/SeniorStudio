import { supabase } from '../services/supabase.js';

const FALLBACK = [
  { id: 'maple-ridge', name: 'Maple Ridge Senior Living', location: 'Lancaster, PA', icon: '🏡', units: 120, accent: '#007aff', logo_url: null },
  { id: 'garden-view', name: 'Garden View Estates', location: 'York, PA', icon: '🌿', units: 84, accent: '#34c759', logo_url: null },
  { id: 'heritage-commons', name: 'Heritage Commons', location: 'Harrisburg, PA', icon: '🏛️', units: 96, accent: '#af52de', logo_url: null },
];

export let COMMUNITIES = [];

export function updateCommunityInList(id, patch) {
  const entry = COMMUNITIES.find(c => c.id === id);
  if (entry) Object.assign(entry, patch);
}

export async function loadCommunities() {
  const { data, error } = await supabase
    .from('communities')
    .select('id, name, location, icon, units, accent')
    .order('name');

  if (error || !data?.length) {
    console.warn('Failed to load communities from Supabase, using fallback:', error?.message);
    COMMUNITIES = FALLBACK;
  } else {
    COMMUNITIES = data;
  }
  return COMMUNITIES;
}
