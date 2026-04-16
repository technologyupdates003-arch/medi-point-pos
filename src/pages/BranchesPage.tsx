import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { Branch } from '../store/mockData';
import { Pencil, Trash2, Plus, MapPin, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function BranchesPage() {
  const { branches, addBranch, updateBranch, deleteBranch, products, transactions } = useApp();
  const [staffCounts, setStaffCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase.from('profiles').select('branch_id').then(({ data }) => {
      const counts: Record<string, number> = {};
      (data || []).forEach(p => { if (p.branch_id) counts[p.branch_id] = (counts[p.branch_id] || 0) + 1; });
      setStaffCounts(counts);
    });
  }, [branches]);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phone: '' });

  const openEdit = (b: Branch) => {
    setForm({ name: b.name, address: b.address, phone: b.phone });
    setEditing(b);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editing) {
      updateBranch({ ...editing, ...form });
      setEditing(null);
    } else {
      addBranch(form);
      setAdding(false);
    }
    setForm({ name: '', address: '', phone: '' });
  };

  const getBranchStats = (branchId: string) => {
    const branchUsers = users.filter(u => u.branchId === branchId);
    const branchProducts = products.filter(p => p.branchId === branchId);
    const branchTx = transactions.filter(t => t.branchId === branchId);
    const revenue = branchTx.reduce((s, t) => s + t.total, 0);
    return { users: branchUsers.length, products: branchProducts.length, transactions: branchTx.length, revenue };
  };

  return (
    <div>
      <div className="win7-titlebar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🏢 Branch Management</span>
        <button className="win7-btn" style={{ fontSize: 11, padding: '2px 10px' }} onClick={() => { setAdding(true); setForm({ name: '', address: '', phone: '' }); }}>
          <Plus size={12} style={{ display: 'inline', marginRight: 4 }} /> Add Branch
        </button>
      </div>
      <div className="win7-panel" style={{ borderTop: 'none', padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {branches.map(b => {
            const stats = getBranchStats(b.id);
            return (
              <div key={b.id} className="win7-card" style={{ borderLeft: '4px solid hsl(210,60%,50%)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{b.name}</div>
                    {b.address && (
                      <div style={{ fontSize: 11, color: '#666', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <MapPin size={10} /> {b.address}
                      </div>
                    )}
                    {b.phone && (
                      <div style={{ fontSize: 11, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={10} /> {b.phone}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="win7-btn" style={{ padding: '1px 6px' }} onClick={() => openEdit(b)}><Pencil size={12} /></button>
                    <button
                      className="win7-btn win7-btn-danger"
                      style={{ padding: '1px 6px' }}
                      onClick={() => deleteBranch(b.id)}
                      disabled={branches.length <= 1}
                      title={branches.length <= 1 ? 'Cannot delete last branch' : 'Delete branch'}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11 }}>
                  <div style={{ background: 'hsl(210 20% 94%)', padding: '4px 8px', borderRadius: 2 }}>
                    <span style={{ color: '#666' }}>Users:</span> <b>{stats.users}</b>
                  </div>
                  <div style={{ background: 'hsl(210 20% 94%)', padding: '4px 8px', borderRadius: 2 }}>
                    <span style={{ color: '#666' }}>Products:</span> <b>{stats.products}</b>
                  </div>
                  <div style={{ background: 'hsl(210 20% 94%)', padding: '4px 8px', borderRadius: 2 }}>
                    <span style={{ color: '#666' }}>Sales:</span> <b>{stats.transactions}</b>
                  </div>
                  <div style={{ background: 'hsl(210 20% 94%)', padding: '4px 8px', borderRadius: 2 }}>
                    <span style={{ color: '#666' }}>Revenue:</span> <b>${stats.revenue.toFixed(0)}</b>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(adding || editing) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ width: 400 }}>
            <div className="win7-titlebar">{editing ? 'Edit Branch' : 'Add Branch'}</div>
            <div className="win7-panel" style={{ padding: 16, borderTop: 'none' }}>
              <form onSubmit={handleSave}>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Branch Name *</label>
                  <input className="win7-input" style={{ width: '100%' }} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Address</label>
                  <input className="win7-input" style={{ width: '100%' }} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Phone</label>
                  <input className="win7-input" style={{ width: '100%' }} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button type="submit" className="win7-btn win7-btn-primary" style={{ flex: 1 }}>Save</button>
                  <button type="button" className="win7-btn" style={{ flex: 1 }} onClick={() => { setAdding(false); setEditing(null); }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
