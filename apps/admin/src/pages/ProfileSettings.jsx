import { useState, useEffect } from 'react';
import { useUser } from '../lib/UserContext';

export default function ProfileSettings() {
  const { user, updateUser } = useUser();
  const [form, setForm] = useState({ name: '', email: '', phone: '', jobTitle: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        jobTitle: user.jobTitle || '',
      });
    }
  }, [user]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const ok = await updateUser(form);
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  const dirty = user && (
    form.name !== user.name ||
    form.email !== user.email ||
    form.phone !== (user.phone || '') ||
    form.jobTitle !== (user.jobTitle || '')
  );

  if (!user) return null;

  return (
    <div className="settings-panel">
      <h3 className="settings-panel-title">Profile</h3>
      <p className="settings-panel-desc">Your personal information.</p>
      <form className="settings-form" onSubmit={handleSave}>
        <div className="settings-field">
          <label className="settings-label">Name</label>
          <input className="settings-input" value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
        </div>
        <div className="settings-field">
          <label className="settings-label">Email</label>
          <input className="settings-input" type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
        </div>
        <div className="settings-field">
          <label className="settings-label">Phone</label>
          <input className="settings-input" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
        </div>
        <div className="settings-field">
          <label className="settings-label">Job Title</label>
          <input className="settings-input" value={form.jobTitle} onChange={(e) => handleChange('jobTitle', e.target.value)} />
        </div>
        <div className="settings-actions">
          <button className="btn-primary" type="submit" disabled={saving || !dirty}>
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
