import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from '../lib/UserContext';
import { useCommunity } from '../lib/CommunityContext';
import MultiSelect from '../components/MultiSelect';

const MODULE_OPTIONS = [
  { key: 'leads', label: 'Leads' },
  { key: 'reports', label: 'Reports' },
  { key: 'shipping', label: 'Shipping' },
];

const ROLE_LABELS = { superadmin: 'Super Admin', admin: 'Admin', user: 'User' };
const STATUS_LABELS = { approved: 'Approved', pending: 'Pending', denied: 'Denied' };

export default function OrgSettings() {
  const { user: currentUser } = useUser();
  const { communities: allCommunities } = useCommunity() || {};
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
      .select('*, admin_user_communities(community_id)')
      .order('name');

    if (error) {
      console.error('Failed to load users:', error.message);
      setLoading(false);
      return;
    }

    const mapped = (data || []).map((u) => ({
      ...u,
      communityIds: (u.admin_user_communities || []).map((r) => r.community_id),
    }));
    setUsers(mapped);
    setLoading(false);
  }

  function startEdit(user) {
    setEditingId(user.id);
    setEditForm({
      role: user.role,
      moduleAccess: [...(user.module_access || [])],
      communityIds: [...(user.communityIds || [])],
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
    if (newRole === 'superadmin') {
      setEditForm({
        role: 'superadmin',
        moduleAccess: MODULE_OPTIONS.map((m) => m.key),
        communityIds: [],
      });
    } else if (newRole === 'admin') {
      setEditForm((prev) => ({
        ...prev,
        role: 'admin',
        moduleAccess: MODULE_OPTIONS.map((m) => m.key),
      }));
    } else {
      setEditForm((prev) => ({ ...prev, role: newRole }));
    }
  }

  async function updateStatus(userId, newStatus) {
    const { error } = await supabase
      .from('admin_users')
      .update({ status: newStatus })
      .eq('id', userId);

    if (error) {
      console.error('Failed to update status:', error.message);
      return;
    }
    await fetchUsers();
  }

  async function saveEdit(userId) {
    setSaving(true);

    const isSuperadminRole = editForm.role === 'superadmin';
    const isAdminRole = editForm.role === 'admin';

    const { error: updateErr } = await supabase
      .from('admin_users')
      .update({
        role: editForm.role,
        module_access: (isSuperadminRole || isAdminRole)
          ? MODULE_OPTIONS.map((m) => m.key)
          : editForm.moduleAccess,
      })
      .eq('id', userId);

    if (updateErr) {
      console.error('Failed to update user:', updateErr.message);
      setSaving(false);
      return;
    }

    await supabase
      .from('admin_user_communities')
      .delete()
      .eq('admin_user_id', userId);

    if (!isSuperadminRole && editForm.communityIds.length > 0) {
      const rows = editForm.communityIds.map((cid) => ({
        admin_user_id: userId,
        community_id: cid,
      }));
      await supabase.from('admin_user_communities').insert(rows);
    }

    await fetchUsers();
    setEditingId(null);
    setSaving(false);
  }

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isAdmin = currentUser?.role === 'admin';
  const canEdit = isSuperAdmin || isAdmin;

  if (!canEdit) {
    return (
      <div className="settings-panel">
        <h3 className="settings-panel-title">Organization</h3>
        <p className="settings-panel-desc">You do not have permission to manage users.</p>
      </div>
    );
  }

  return (
    <div className="settings-panel">
      <h3 className="settings-panel-title">Organization</h3>
      <p className="settings-panel-desc">Manage team members, their roles, and community assignments.</p>

      <div className="org-users-table-wrap">
        <table className="org-users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Communities</th>
              <th>Module Access</th>
              {canEdit && <th></th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={canEdit ? 6 : 5} className="empty-state">Loading...</td></tr>
            ) : users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="org-user-name">
                    <span className="org-user-avatar">{u.name.charAt(0)}</span>
                    <div>
                      <div className="org-user-fullname">{u.name}</div>
                      <div className="org-user-title">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  {editingId === u.id ? (
                    <select
                      className="settings-select-sm"
                      value={editForm.role}
                      onChange={(e) => handleRoleChange(e.target.value)}
                    >
                      {isSuperAdmin && <option value="superadmin">Super Admin</option>}
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
                  <div className="org-user-status">
                    <span className={`status-badge status-badge--${u.status || 'approved'}`}>
                      {STATUS_LABELS[u.status || 'approved']}
                    </span>
                    {isSuperAdmin && u.status === 'pending' && u.id !== currentUser?.id && (
                      <div className="org-user-actions" style={{ marginTop: 6 }}>
                        <button className="btn-primary btn-sm" onClick={() => updateStatus(u.id, 'approved')}>Approve</button>
                        <button className="btn-danger btn-sm" onClick={() => updateStatus(u.id, 'denied')}>Deny</button>
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  {editingId === u.id ? (
                    editForm.role === 'superadmin' ? (
                      <span className="module-badge module-badge--all">All Communities</span>
                    ) : (
                      <MultiSelect
                        options={(allCommunities || []).map((c) => ({
                          value: c.id,
                          label: c.name,
                        }))}
                        selected={editForm.communityIds}
                        onChange={(ids) => setEditForm((prev) => ({ ...prev, communityIds: ids }))}
                      />
                    )
                  ) : (
                    <div className="module-badges">
                      {u.role === 'superadmin' ? (
                        <span className="module-badge module-badge--all">All Communities</span>
                      ) : u.communityIds.length > 0 ? (
                        u.communityIds.map((cid) => {
                          const comm = (allCommunities || []).find((c) => c.id === cid);
                          return (
                            <span key={cid} className="module-badge">
                              {comm ? comm.name : cid.substring(0, 8)}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-muted">None</span>
                      )}
                    </div>
                  )}
                </td>
                <td>
                  {editingId === u.id ? (
                    <div className="module-toggles">
                      {MODULE_OPTIONS.map((mod) => (
                        <label key={mod.key} className="module-toggle">
                          <input
                            type="checkbox"
                            checked={editForm.role === 'superadmin' || editForm.role === 'admin' || editForm.moduleAccess.includes(mod.key)}
                            disabled={editForm.role === 'superadmin' || editForm.role === 'admin'}
                            onChange={() => toggleModule(mod.key)}
                          />
                          <span>{mod.label}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="module-badges">
                      {u.role === 'superadmin' || u.role === 'admin' ? (
                        <span className="module-badge module-badge--all">All Modules</span>
                      ) : (
                        (u.module_access || []).map((m) => (
                          <span key={m} className="module-badge">{MODULE_OPTIONS.find((o) => o.key === m)?.label || m}</span>
                        ))
                      )}
                      {u.role !== 'superadmin' && u.role !== 'admin' && (u.module_access || []).length === 0 && (
                        <span className="text-muted">None</span>
                      )}
                    </div>
                  )}
                </td>
                {canEdit && (
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
                        disabled={u.id === currentUser?.id || (!isSuperAdmin && u.role !== 'user')}
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
