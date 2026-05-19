import { Outlet, NavLink } from 'react-router-dom';
import { useUser } from '../lib/UserContext';
import { useCommunity } from '../lib/CommunityContext';

export default function Layout() {
  const { user } = useUser();
  const { communities, activeCommunityId, setActiveCommunityId, isSuperAdmin } = useCommunity() || {};
  const initials = user ? user.name.split(' ').map((n) => n[0]).join('') : '';

  const showSwitcher = communities && (isSuperAdmin || communities.length > 1);

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo">
            <span className="logo-icon">◆</span>
            <span className="logo-text">SeniorStudio</span>
          </div>
          <span className={`sidebar-badge${isSuperAdmin ? ' sidebar-badge--super' : ''}`}>
            {isSuperAdmin ? 'Super Admin' : 'Admin'}
          </span>
        </div>

        {showSwitcher ? (
          <div className="sidebar-community">
            <select
              className="community-select"
              value={activeCommunityId || ''}
              onChange={(e) => setActiveCommunityId(e.target.value)}
            >
              {isSuperAdmin && <option value="all">All Communities</option>}
              {(communities || []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        ) : communities && communities.length === 1 ? (
          <div className="sidebar-community">
            <div className="community-label">{communities[0].name}</div>
          </div>
        ) : null}

        <nav className="sidebar-nav">
          <NavLink to="/" end className="sidebar-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Leads
          </NavLink>
          <NavLink to="/reports" className="sidebar-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            Reports
          </NavLink>
          <NavLink to="/shipping" className="sidebar-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="2"/>
              <path d="M16 8h4l3 3v5h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            Shipping
          </NavLink>
        </nav>

        <div className="sidebar-bottom">
          <NavLink to="/settings" className="sidebar-link sidebar-link--settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Settings
          </NavLink>
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name || ''}</span>
              <span className="sidebar-user-role">{user?.jobTitle || ''}</span>
            </div>
          </div>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
