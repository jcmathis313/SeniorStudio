import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import StatusBadge from '../components/StatusBadge';
import CollectionsList from '../components/CollectionsList';

export default function Leads() {
  const [search, setSearch] = useState('');
  const [communityFilter, setCommunityFilter] = useState('all');
  const [communities, setCommunities] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const [commRes, resRes] = await Promise.all([
        supabase
          .from('communities')
          .select('id, name, icon')
          .order('name'),
        supabase
          .from('residents')
          .select(`
            id, first_name, last_name, email, phone, unit_number, community_id,
            communities (id, name, icon),
            collections (id, name, saved_at),
            welcome_boxes (id, status, created_at),
            design_samples (id, status, created_at)
          `)
          .order('last_name'),
      ]);

      if (commRes.error || resRes.error) {
        const msg = commRes.error?.message || resRes.error?.message;
        console.error('Error fetching data:', msg);
        setError(msg);
        setLoading(false);
        return;
      }

      setCommunities(commRes.data || []);

      const transformed = (resRes.data || []).map((r) => ({
        id: r.id,
        firstName: r.first_name,
        lastName: r.last_name,
        email: r.email,
        phone: r.phone,
        unit: r.unit_number || '',
        communityId: r.community_id,
        communityName: r.communities?.name || 'Unknown',
        communityIcon: r.communities?.icon || '',
        collections: (r.collections || [])
          .sort((a, b) => new Date(b.saved_at) - new Date(a.saved_at))
          .map((c) => ({
            id: c.id,
            name: c.name,
            savedAt: c.saved_at,
          })),
        welcomeBox: r.welcome_boxes?.length
          ? r.welcome_boxes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].status
          : 'pending',
        designSamples: r.design_samples?.length
          ? r.design_samples.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].status
          : 'pending',
      }));

      setResidents(transformed);
      setLoading(false);
    }

    fetchData();
  }, []);

  const filtered = residents.filter((r) => {
    if (communityFilter !== 'all' && r.communityId !== communityFilter) return false;
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      r.firstName.toLowerCase().includes(term) ||
      r.lastName.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      r.unit.toLowerCase().includes(term) ||
      r.communityName.toLowerCase().includes(term)
    );
  });

  const subtitle = loading
    ? 'Loading...'
    : communityFilter === 'all'
      ? `${residents.length} leads across ${communities.length} communities`
      : `${filtered.length} leads in ${communities.find((c) => c.id === communityFilter)?.name || ''}`;

  return (
    <div className="page-leads">
      <div className="page-header">
        <div>
          <h2 className="page-title">Leads</h2>
          <p className="page-subtitle">{subtitle}</p>
        </div>
        <div className="page-actions">
          <select
            className="filter-select"
            value={communityFilter}
            onChange={(e) => setCommunityFilter(e.target.value)}
          >
            <option value="all">All Communities</option>
            {communities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          <div className="search-box">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M11.5 11.5L14.5 14.5M7.5 13C4.46243 13 2 10.5376 2 7.5C2 4.46243 4.46243 2 7.5 2C10.5376 2 13 4.46243 13 7.5C13 10.5376 10.5376 13 7.5 13Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          Failed to load leads: {error}
        </div>
      )}

      <div className="table-container">
        <table className="leads-table">
          <thead>
            <tr>
              <th>Lead</th>
              <th>Community</th>
              <th>Unit</th>
              <th>Collections</th>
              <th>Welcome Box</th>
              <th>Design Samples</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="empty-state">Loading leads...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  {residents.length === 0
                    ? 'No leads yet. Add your first lead to get started.'
                    : 'No leads match your search.'}
                </td>
              </tr>
            ) : (
              filtered.map((resident) => (
                <tr key={resident.id}>
                  <td>
                    <div className="lead-cell">
                      <span className="lead-name">
                        {resident.firstName} {resident.lastName}
                      </span>
                      <span className="lead-email">{resident.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className="community-cell">
                      <span className="community-icon">{resident.communityIcon}</span>
                      {resident.communityName}
                    </span>
                  </td>
                  <td>
                    <span className="unit-badge">{resident.unit}</span>
                  </td>
                  <td>
                    <CollectionsList collections={resident.collections} />
                  </td>
                  <td>
                    <StatusBadge status={resident.welcomeBox} />
                  </td>
                  <td>
                    <StatusBadge status={resident.designSamples} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
