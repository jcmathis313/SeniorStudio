import { Outlet, NavLink } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="header-left">
          <h1 className="logo">
            <span className="logo-icon">◆</span>
            SeniorStudio
          </h1>
          <span className="header-badge">Admin</span>
        </div>
        <nav className="header-nav">
          <NavLink to="/" className="nav-link">Residents</NavLink>
          <NavLink to="/shipping" className="nav-link">Shipping</NavLink>
        </nav>
        <div className="header-right">
          <span className="community-label">Nolt Mathis Construction</span>
        </div>
      </header>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
