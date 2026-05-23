import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: window.location.origin + '/reset-password' }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-logo">
          <span className="auth-logo-icon">&#9670;</span>
          <span className="auth-logo-text">SeniorStudio</span>
        </div>
        <h1 className="auth-title">Reset password</h1>
        <p className="auth-subtitle">We'll send you a link to reset your password</p>

        {error && <div className="auth-error">{error}</div>}
        {sent && (
          <div className="auth-success">
            Check your email for a password reset link.
          </div>
        )}

        {!sent && (
          <div className="auth-form">
            <div className="auth-field">
              <label className="auth-label" htmlFor="reset-email">Email</label>
              <input
                id="reset-email"
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        )}

        <div className="auth-links">
          <Link to="/login" className="auth-link">Back to Sign In</Link>
        </div>
      </form>
    </div>
  );
}
