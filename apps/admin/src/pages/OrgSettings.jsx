import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../lib/UserContext';

const MODULE_OPTIONS = [
  { key: 'leads', label: 'Leads' },
  { key: 'reports', label: 'Reports' },
  { key: 'shipping', label: 'Shipping' },
];

const ROLE_LABELS = { admin: 'Admin', user: 'User' };

export default function OrgSettings() {
  const { user: currentUser } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('name');

    if (error) {
      console.error('Failed to load users:', error.message);
      setLoading(false);
      return;
    }
    setUsers(data || []);
    setLoading(false);
  }

  function startEdit(user) {
    setEditingId(user.id);
    setEditForm({
      role: user.role,
      moduleAccess: [...(user.module_access || [])],
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  function toggleModule(moduleKey) {
    setEditForm((prev) => {
      const current = prev.moduleAccess || [];
      const next = current.includes(moduleKey)
        ? current.filter((m) => m !== moduleKey)
        : [...current, moduleKey];
      return { ...prev, moduleAccess: next };
    });
  }

  function handleRoleChange(newRole) {
    if (newRole === 'admin') {
      setEditForm({ role: 'admin', moduleAccess: MODULE_OPTIONS.map((m) => m.key) });
    } else {
      setEditForm((prev) => ({ ...prev, role: newRole }));
    }
  }

  async function saveEdit(userId) {
    setSaving(true);
    const { error } = await supabase
      .from('admin_users')
      .update({
        role: editForm.role,
        module_access: editForm.role === 'admin'
          ? MODULE_OPTIONS.map((m) => m.key)
          : editForm.moduleAccess,
      })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update user:', error.message);
      setSaving(false);
      return;
    }

    await fetchUsers();
    setEditingId(null);
    setSaving(false);
  }

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="settings-panel">
      <h3 className="settings-panel-title">Organization</h3>
      <p className="settings-panel-desc">Manage team members and their access to modules.</p>

      <div className="org-users-table-wrap">
        <table className="org-users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Module Access</th>
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isAdmin ? 5 : 4} className="empty-state">Loading...</td></tr>
            ) : users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="org-user-name">
                    <span className="org-user-avatar">{u.name.charAt(0)}</span>
                    <div>
                      <div className="org-user-fullname">{u.name}</div>
                      <div className="org-user-title">{u.job_title || '—'}</div>
                    </div>
                  </div>
                </td>
                <td className="org-user-email">{u.email}</td>
                <td>
                  {editingId === u.id ? (
                    <select
                      className="settings-select-sm"
                      value={editForm.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                    >
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                    </select>
                  ) : (
                    <span className={`role-badge role-badge--${u.role}`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  )}
                </td>
                <td>
                  {editingId === u.id ? (
                    <div className="module-toggles">
                      {MODULE_OPTIONS.map((mod) => (
                        <label key={mod.key} className="module-toggle">
                          <input
                            type="checkbox"
                            checked={editForm.role === 'admin' || editForm.moduleAccess.includes(mod.key)}
                            disabled={editForm.role === 'admin'}
                            onChange={() => toggleModule(mod.key)}
                          />
                          <span>{mod.label}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="module-badges">
                      {u.role === 'admin' ? (
                        <span className="module-badge module-badge--all">All Modules</span>
                      ) : (
                        (u.module_access || []).map((m) => (
                          <span key={m} className="module-badge">{MODULE_OPTIONS.find((o) => o.key === m)?.label || m}</span>
                        ))
                      )}
                      {u.role !== 'admin' && (u.module_access || []).length === 0 && (
                        <span className="text-muted">None</span>
                      )}
                    </div>
                  )}
                </td>
                {isAdmin && (
                  <td>
                    {editingId === u.id ? (
                      <div className="org-user-actions">
                        <button className="btn-primary btn-sm" disabled={saving} onClick={() => saveEdit(u.id)}>
                          Save
                        </button>
                        <button className="btn-secondary btn-sm" onClick={cancelEdit}>Cancel</button>
                      </div>
                    ) : (
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => startEdit(u)}
                        disabled={u.id === currentUser?.id}
                        title={u.id === currentUser?.id ? 'Cannot edit your own role' : ''}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
