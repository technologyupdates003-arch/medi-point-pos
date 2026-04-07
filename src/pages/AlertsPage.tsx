import { useApp } from '../store/AppContext';
import { AlertTriangle } from 'lucide-react';

export default function AlertsPage() {
  const { products, currentBranchId } = useApp();
  const now = new Date();
  const branchProducts = currentBranchId ? products.filter(p => p.branchId === currentBranchId) : products;
  const lowStock = branchProducts.filter(p => p.stock < 10 && p.stock > 0);
  const outOfStock = branchProducts.filter(p => p.stock <= 0);
  const expired = branchProducts.filter(p => new Date(p.expiryDate) < now);

  return (
    <div>
      <div className="win7-titlebar">⚠️ Alerts & Warnings</div>
      <div className="win7-panel" style={{ borderTop: 'none', padding: 16 }}>
        {expired.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'hsl(0,70%,50%)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={16} /> Expired Products ({expired.length})
            </h3>
            <table className="win7-table">
              <thead><tr><th>Product</th><th>Expiry Date</th><th>Stock</th></tr></thead>
              <tbody>
                {expired.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ color: 'hsl(0,70%,50%)' }}>{p.expiryDate}</td>
                    <td>{p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {lowStock.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'hsl(40,90%,40%)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={16} /> Low Stock ({lowStock.length})
            </h3>
            <table className="win7-table">
              <thead><tr><th>Product</th><th>Stock</th><th>Category</th></tr></thead>
              <tbody>
                {lowStock.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ color: 'hsl(40,90%,40%)', fontWeight: 700 }}>{p.stock}</td>
                    <td>{p.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {outOfStock.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'hsl(0,70%,50%)', marginBottom: 8 }}>
              Out of Stock ({outOfStock.length})
            </h3>
            <table className="win7-table">
              <thead><tr><th>Product</th><th>Category</th></tr></thead>
              <tbody>
                {outOfStock.map(p => (
                  <tr key={p.id}><td style={{ fontWeight: 600 }}>{p.name}</td><td>{p.category}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {expired.length === 0 && lowStock.length === 0 && outOfStock.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'hsl(120,45%,42%)', fontWeight: 600 }}>
            ✅ No alerts — all products are in good standing!
          </div>
        )}
      </div>
    </div>
  );
}
