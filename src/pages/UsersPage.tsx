import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Trash2, Plus } from 'lucide-react';

export default function UsersPage() {
  const { users, addUser, deleteUser, currentUser, branches } = useApp();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'cashier' as 'admin' | 'cashier', branchId: '' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.some(u => u.username === form.username)) return;
    addUser({ ...form, branchId: form.branchId || undefined });
    setForm({ username: '', password: '', name: '', role: 'cashier', branchId: '' });
    setAdding(false);
  };

  const getBranchName = (branchId?: string) => {
    if (!branchId) return '—';
    return branches.find(b => b.id === branchId)?.name || '—';
  };

  return (
    <div>
      <div className="win7-titlebar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>👥 User Management</span>
        <button className="win7-btn" style={{ fontSize: 11, padding: '2px 10px' }} onClick={() => setAdding(true)}>
          <Plus size={12} style={{ display: 'inline', marginRight: 4 }} /> Add User
        </button>
      </div>
      <div className="win7-panel" style={{ borderTop: 'none' }}>
        <table className="win7-table">
          <thead>
            <tr><th>Username</th><th>Name</th><th>Role</th><th>Branch</th><th style={{ width: 80 }}>Actions</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.username}</td>
                <td>{u.name}</td>
                <td><span className={u.role === 'admin' ? 'badge-expired' : 'badge-ok'} style={{ background: u.role === 'admin' ? 'hsl(210,60%,50%)' : 'hsl(120,45%,42%)' }}>{u.role.toUpperCase()}</span></td>
                <td style={{ fontSize: 11 }}>{getBranchName(u.branchId)}</td>
                <td>
                  <button
                    className="win7-btn win7-btn-danger"
                    style={{ padding: '1px 6px' }}
                    onClick={() => deleteUser(u.id)}
                    disabled={u.id === currentUser?.id}
                    title={u.id === currentUser?.id ? 'Cannot delete yourself' : 'Delete user'}
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {adding && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ width: 360 }}>
            <div className="win7-titlebar">Add User</div>
            <div className="win7-panel" style={{ padding: 16, borderTop: 'none' }}>
              <form onSubmit={handleAdd}>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Full Name</label>
                  <input className="win7-input" style={{ width: '100%' }} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Username</label>
                  <input className="win7-input" style={{ width: '100%' }} value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Password</label>
                  <input className="win7-input" type="password" style={{ width: '100%' }} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Role</label>
                  <select className="win7-input" style={{ width: '100%' }} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as 'admin' | 'cashier' }))}>
                    <option value="cashier">Cashier</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Assign to Branch</label>
                  <select className="win7-input" style={{ width: '100%' }} value={form.branchId} onChange={e => setForm(p => ({ ...p, branchId: e.target.value }))}>
                    <option value="">— Select Branch —</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button type="submit" className="win7-btn win7-btn-primary" style={{ flex: 1 }}>Save</button>
                  <button type="button" className="win7-btn" style={{ flex: 1 }} onClick={() => setAdding(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
