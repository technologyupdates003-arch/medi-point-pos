import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { Trash2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface StaffUser {
  id: string;
  name: string;
  role: string;
  branch_id: string | null;
  created_at: string;
}

export default function UsersPage() {
  const { currentUser, branches } = useApp();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', branchId: '' });
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at');
    setUsers(data || []);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Create the auth account with cashier role
      const { error: signUpErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            name: form.name,
            role: 'cashier',
          },
        },
      });
      if (signUpErr) throw signUpErr;

      // Update branch assignment if specified
      // Small delay to let the trigger create the profile
      setTimeout(async () => {
        if (form.branchId) {
          const { data: profiles } = await supabase.from('profiles').select('id').order('created_at', { ascending: false }).limit(1);
          if (profiles?.[0]) {
            await supabase.from('profiles').update({ branch_id: form.branchId }).eq('id', profiles[0].id);
          }
        }
        await fetchUsers();
      }, 1000);

      setForm({ email: '', password: '', name: '', branchId: '' });
      setAdding(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (userId === currentUser?.id) return;
    // We can't delete auth users from client, but we can remove the profile
    await supabase.from('profiles').delete().eq('id', userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const getBranchName = (branchId?: string | null) => {
    if (!branchId) return '—';
    return branches.find(b => b.id === branchId)?.name || '—';
  };

  return (
    <div>
      <div className="win7-titlebar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>👥 Staff Management</span>
        <button className="win7-btn" style={{ fontSize: 11, padding: '2px 10px' }} onClick={() => setAdding(true)}>
          <Plus size={12} style={{ display: 'inline', marginRight: 4 }} /> Add Cashier
        </button>
      </div>
      <div className="win7-panel" style={{ borderTop: 'none' }}>
        <table className="win7-table">
          <thead>
            <tr><th>Name</th><th>Role</th><th>Branch</th><th>Joined</th><th style={{ width: 80 }}>Actions</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 3,
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 700,
                    background: u.role === 'admin' ? 'hsl(210,60%,50%)' : 'hsl(120,45%,42%)',
                  }}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ fontSize: 11 }}>{getBranchName(u.branch_id)}</td>
                <td style={{ fontSize: 11 }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <button
                    className="win7-btn win7-btn-danger"
                    style={{ padding: '1px 6px' }}
                    onClick={() => handleDelete(u.id)}
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
            <div className="win7-titlebar">Add Cashier</div>
            <div className="win7-panel" style={{ padding: 16, borderTop: 'none' }}>
              <form onSubmit={handleAdd}>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Full Name</label>
                  <input className="win7-input" style={{ width: '100%' }} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Email</label>
                  <input className="win7-input" type="email" style={{ width: '100%' }} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Password</label>
                  <input className="win7-input" type="password" style={{ width: '100%' }} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} />
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
                {error && <div style={{ color: 'hsl(0 70% 50%)', marginBottom: 8, fontSize: 12 }}>{error}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button type="submit" className="win7-btn win7-btn-primary" style={{ flex: 1 }} disabled={loading}>
                    {loading ? 'Creating...' : 'Create Cashier'}
                  </button>
                  <button type="button" className="win7-btn" style={{ flex: 1 }} onClick={() => { setAdding(false); setError(''); }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
