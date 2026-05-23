import { createContext, useContext, useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthGuard() {
  const [authUser, setAuthUser] = useState(null);
  const [adminStatus, setAdminStatus] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUser(session.user);
        checkAdminStatus(session.user);
      } else {
        setChecking(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthUser(session.user);
        checkAdminStatus(session.user);
      } else {
        setAuthUser(null);
        setAdminStatus(null);
        setChecking(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkAdminStatus(user) {
    let { data, error } = await supabase
      .from('admin_users')
      .select('status')
      .eq('auth_id', user.id)
      .single();

    if (error || !data) {
      const { data: emailMatch } = await supabase
        .from('admin_users')
        .select('id, status')
        .eq('email', user.email)
        .single();

      if (emailMatch) {
        await supabase
          .from('admin_users')
          .update({ auth_id: user.id })
          .eq('id', emailMatch.id);
        data = emailMatch;
      }
    }

    setAdminStatus(data?.status || null);
    setChecking(false);
  }

  if (checking) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <p className="auth-subtitle">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return <Navigate to="/login" replace />;
  }

  if (adminStatus === 'pending') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <span className="auth-logo-icon">&#9670;</span>
            <span className="auth-logo-text">SeniorStudio</span>
          </div>
          <h1 className="auth-title">Account pending</h1>
          <p className="auth-subtitle">
            Your registration is awaiting administrator approval. You'll be able to access SeniorStudio once your account has been approved.
          </p>
          <button
            className="auth-submit"
            onClick={() => supabase.auth.signOut()}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (adminStatus === 'denied') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <span className="auth-logo-icon">&#9670;</span>
            <span className="auth-logo-text">SeniorStudio</span>
          </div>
          <h1 className="auth-title">Access denied</h1>
          <p className="auth-subtitle">
            Your registration was not approved. Contact an administrator for assistance.
          </p>
          <button
            className="auth-submit"
            onClick={() => supabase.auth.signOut()}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (!adminStatus) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AuthContext.Provider value={{ authUser }}>
      <Outlet />
    </AuthContext.Provider>
  );
}
