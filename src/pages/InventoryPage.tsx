import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Product } from '../store/mockData';
import { Pencil, Trash2, Plus } from 'lucide-react';

const categories = ['Tablet', 'Syrup', 'Injection', 'Cream', 'Drops', 'Capsule'];

function ProductForm({ initial, onSave, onCancel }: {
  initial?: Product;
  onSave: (p: Omit<Product, 'id'> & { id?: string }) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    category: initial?.category || 'Tablet',
    buyingPrice: initial?.buyingPrice?.toString() || '',
    sellingPrice: initial?.sellingPrice?.toString() || '',
    stock: initial?.stock?.toString() || '',
    expiryDate: initial?.expiryDate || '',
    barcode: initial?.barcode || Math.floor(1000000 + Math.random() * 9000000).toString(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(initial ? { id: initial.id } : {}),
      name: form.name,
      category: form.category,
      buyingPrice: parseFloat(form.buyingPrice),
      sellingPrice: parseFloat(form.sellingPrice),
      stock: parseInt(form.stock),
      expiryDate: form.expiryDate,
      barcode: form.barcode,
    });
  };

  const fields: { key: keyof typeof form; label: string; type?: string }[] = [
    { key: 'name', label: 'Product Name' },
    { key: 'buyingPrice', label: 'Buying Price', type: 'number' },
    { key: 'sellingPrice', label: 'Selling Price', type: 'number' },
    { key: 'stock', label: 'Stock Quantity', type: 'number' },
    { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
    { key: 'barcode', label: 'Barcode' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ width: 420 }}>
        <div className="win7-titlebar">{initial ? 'Edit Product' : 'Add Product'}</div>
        <div className="win7-panel" style={{ padding: 16, borderTop: 'none' }}>
          <form onSubmit={handleSubmit}>
            {fields.map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{f.label}</label>
                <input
                  className="win7-input"
                  style={{ width: '100%' }}
                  type={f.type || 'text'}
                  value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  required
                  step={f.type === 'number' ? '0.01' : undefined}
                />
              </div>
            ))}
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 2 }}>Category</label>
              <select
                className="win7-input"
                style={{ width: '100%' }}
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
              >
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button type="submit" className="win7-btn win7-btn-primary" style={{ flex: 1 }}>Save</button>
              <button type="button" className="win7-btn" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { products, addProduct, updateProduct, deleteProduct, currentBranchId } = useApp();
  const [editing, setEditing] = useState<Product | null>(null);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState('');

  const now = new Date();
  const branchProducts = currentBranchId ? products.filter(p => p.branchId === currentBranchId) : products;
  const filtered = branchProducts.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));

  const getStatus = (p: Product) => {
    if (new Date(p.expiryDate) < now) return 'EXPIRED';
    if (p.stock < 10) return 'LOW STOCK';
    return 'OK';
  };

  return (
    <div>
      <div className="win7-titlebar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>📦 Inventory Management</span>
        <button className="win7-btn" style={{ fontSize: 11, padding: '2px 10px' }} onClick={() => setAdding(true)}>
          <Plus size={12} style={{ display: 'inline', marginRight: 4 }} /> Add Product
        </button>
      </div>
      <div className="win7-panel" style={{ borderTop: 'none' }}>
        <div style={{ padding: 8 }}>
          <input
            className="win7-input"
            placeholder="Filter products..."
            style={{ width: 300 }}
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
        <table className="win7-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Buy $</th>
              <th>Sell $</th>
              <th>Stock</th>
              <th>Expiry</th>
              <th>Barcode</th>
              <th>Status</th>
              <th style={{ width: 80 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const status = getStatus(p);
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>{p.category}</td>
                  <td>${p.buyingPrice.toFixed(2)}</td>
                  <td>${p.sellingPrice.toFixed(2)}</td>
                  <td>{p.stock}</td>
                  <td>{p.expiryDate}</td>
                  <td style={{ fontSize: 11 }}>{p.barcode}</td>
                  <td>
                    <span className={status === 'EXPIRED' ? 'badge-expired' : status === 'LOW STOCK' ? 'badge-low-stock' : 'badge-ok'}>
                      {status}
                    </span>
                  </td>
                  <td>
                    <button className="win7-btn" style={{ padding: '1px 6px', marginRight: 4 }} onClick={() => setEditing(p)}><Pencil size={12} /></button>
                    <button className="win7-btn win7-btn-danger" style={{ padding: '1px 6px' }} onClick={() => deleteProduct(p.id)}><Trash2 size={12} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {adding && (
        <ProductForm
          onSave={p => { addProduct(p as Omit<Product, 'id'>); setAdding(false); }}
          onCancel={() => setAdding(false)}
        />
      )}
      {editing && (
        <ProductForm
          initial={editing}
          onSave={p => { updateProduct(p as Product); setEditing(null); }}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}
