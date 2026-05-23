import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('admin_users').insert({
      name: name.trim(),
      email: email.trim(),
      auth_id: authData.user.id,
      status: 'pending',
      role: 'user',
      module_access: [],
    });

    if (insertError) {
      setError('Account created but profile setup failed. Contact an administrator.');
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <span className="auth-logo-icon">&#9670;</span>
            <span className="auth-logo-text">SeniorStudio</span>
          </div>
          <h1 className="auth-title">Registration submitted</h1>
          <p className="auth-subtitle">
            Your account is pending administrator approval. You'll be able to sign in once approved.
          </p>
          <Link to="/login" className="auth-submit" style={{ textAlign: 'center', display: 'block' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-logo">
          <span className="auth-logo-icon">&#9670;</span>
          <span className="auth-logo-text">SeniorStudio</span>
        </div>
        <h1 className="auth-title">Create an account</h1>
        <p className="auth-subtitle">Request access to SeniorStudio</p>

        {error && <div className="auth-error">{error}</div>}

        <div className="auth-form">
          <div className="auth-field">
            <label className="auth-label" htmlFor="name">Full name</label>
            <input
              id="name"
              className="auth-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              autoFocus
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-email">Email</label>
            <input
              id="reg-email"
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              className="auth-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="reg-confirm">Confirm password</label>
            <input
              id="reg-confirm"
              className="auth-input"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </div>

        <div className="auth-links">
          <Link to="/login" className="auth-link">Already have an account? Sign in</Link>
        </div>
      </form>
    </div>
  );
}
