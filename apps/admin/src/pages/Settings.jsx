import { NavLink, Outlet } from 'react-router-dom';
import { useUser } from '../lib/UserContext';

export default function Settings() {
  const { user } = useUser();
  const canManageOrg = user?.role === 'superadmin' || user?.role === 'admin';

  return (
    <div className="page-settings">
      <div className="page-header">
        <div>
          <h2 className="page-title">Settings</h2>
        </div>
      </div>
      <div className="settings-layout">
        <nav className="settings-nav">
          <NavLink to="/settings" end className="settings-nav-link">Profile</NavLink>
          {canManageOrg && (
            <NavLink to="/settings/organization" className="settings-nav-link">Organization</NavLink>
          )}
        </nav>
        <div className="settings-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
