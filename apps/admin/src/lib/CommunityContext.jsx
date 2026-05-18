import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import { useUser } from './UserContext';

const CommunityContext = createContext(null);

const STORAGE_KEY = 'seniorstudio_active_community';

export function CommunityProvider({ children }) {
  const { user } = useUser();
  const [communities, setCommunities] = useState([]);
  const [activeCommunityId, setActiveCommunityIdState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchCommunities() {
      let list = [];

      if (user.role === 'superadmin') {
        const { data } = await supabase
          .from('communities')
          .select('id, name, icon, location')
          .order('name');
        list = data || [];
      } else {
        const { data } = await supabase
          .from('admin_user_communities')
          .select('community_id, communities(id, name, icon, location)')
          .eq('admin_user_id', user.id);
        list = (data || []).map((r) => r.communities);
      }

      setCommunities(list);

      const stored = localStorage.getItem(STORAGE_KEY);
      const validStored = stored && (stored === 'all' || list.some((c) => c.id === stored));

      if (validStored) {
        setActiveCommunityIdState(stored);
      } else if (user.role === 'superadmin') {
        setActiveCommunityIdState('all');
      } else if (list.length > 0) {
        setActiveCommunityIdState(list[0].id);
      }

      setLoading(false);
    }

    fetchCommunities();
  }, [user]);

  function setActiveCommunityId(id) {
    setActiveCommunityIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  function scopeQuery(query, column = 'community_id') {
    if (activeCommunityId === 'all') return query;
    return query.eq(column, activeCommunityId);
  }

  const activeCommunity = activeCommunityId === 'all'
    ? null
    : communities.find((c) => c.id === activeCommunityId) || null;

  return (
    <CommunityContext.Provider value={{
      communities,
      activeCommunityId,
      activeCommunity,
      setActiveCommunityId,
      scopeQuery,
      loading,
      isSuperAdmin: user?.role === 'superadmin',
    }}>
      {children}
    </CommunityContext.Provider>
  );
}

export function useCommunity() {
  return useContext(CommunityContext);
}
