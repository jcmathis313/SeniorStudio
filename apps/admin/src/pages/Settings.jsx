import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export default function Settings() {
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
          <NavLink to="/settings/organization" className="settings-nav-link">Organization</NavLink>
        </nav>
        <div className="settings-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
