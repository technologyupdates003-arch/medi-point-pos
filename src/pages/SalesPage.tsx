import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Transaction } from '../store/mockData';
import { Printer } from 'lucide-react';

export default function SalesPage() {
  const { transactions, businessSettings, currentBranchId } = useApp();
  const [dateFilter, setDateFilter] = useState('');
  const [viewing, setViewing] = useState<Transaction | null>(null);

  const branchTx = currentBranchId ? transactions.filter(t => t.branchId === currentBranchId) : transactions;
  const filtered = dateFilter
    ? branchTx.filter(t => t.date.startsWith(dateFilter))
    : branchTx;

  return (
    <div>
      <div className="win7-titlebar">🧾 Sales History</div>
      <div className="win7-panel" style={{ borderTop: 'none' }}>
        <div style={{ padding: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Filter by date:</label>
          <input
            className="win7-input"
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          />
          {dateFilter && <button className="win7-btn" onClick={() => setDateFilter('')}>Clear</button>}
        </div>
        <table className="win7-table">
          <thead>
            <tr>
              <th>Receipt #</th>
              <th>Date/Time</th>
              <th>Items</th>
              <th>Total</th>
              <th>Cashier</th>
              <th style={{ width: 80 }}>View</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20, color: '#999' }}>No transactions found</td></tr>
            ) : filtered.map(t => (
              <tr key={t.id}>
                <td style={{ fontWeight: 600 }}>{t.id}</td>
                <td>{new Date(t.date).toLocaleString()}</td>
                <td>{t.items.length} item(s)</td>
                <td>${t.total.toFixed(2)}</td>
                <td>{t.cashier}</td>
                <td>
                  <button className="win7-btn win7-btn-primary" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => setViewing(t)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setViewing(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 2, width: 302 }}>
            <div className="win7-titlebar" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Receipt — {viewing.id}</span>
              <button onClick={() => setViewing(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="receipt" style={{ padding: '12px 10px', fontFamily: 'monospace', fontSize: 11, width: 280 }}>
              <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 13 }}>💊 {businessSettings.businessName}</div>
              <div style={{ textAlign: 'center', fontSize: 10 }}>{businessSettings.address}</div>
              {businessSettings.phone && <div style={{ textAlign: 'center', fontSize: 10 }}>{businessSettings.phone}</div>}
              <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />
              <div style={{ fontSize: 10 }}>Date: {new Date(viewing.date).toLocaleString()}</div>
              <div style={{ fontSize: 10 }}>Receipt #: {viewing.id}</div>
              <div style={{ fontSize: 10 }}>Cashier: {viewing.cashier}</div>
              <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />
              {viewing.items.map((item, i) => (
                <div key={i} style={{ marginBottom: 2 }}>
                  <div style={{ fontSize: 10 }}>{item.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                    <span>{item.qty} x ${item.price.toFixed(2)}</span>
                    <span>${item.subtotal.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 12 }}>
                <span>TOTAL</span><span>${viewing.total.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                <span>Cash</span><span>${viewing.cashPaid.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                <span>Balance</span><span>${viewing.balance.toFixed(2)}</span>
              </div>
              <div style={{ borderBottom: '1px dashed #000', margin: '6px 0' }} />
              <div style={{ textAlign: 'center', fontSize: 9 }}>Thank you for your purchase!</div>
              <div style={{ textAlign: 'center', fontSize: 8, marginTop: 4, color: '#666' }}>Powered by Abancool Technology</div>
              <div style={{ textAlign: 'center', fontSize: 8, color: '#666' }}>0728825152 / 01116679286</div>
            </div>
            <div style={{ padding: '8px 10px 12px', textAlign: 'center' }}>
              <button className="win7-btn win7-btn-primary" onClick={() => window.print()}><Printer size={14} style={{ display: 'inline', marginRight: 4 }} />Print</button>
              <button className="win7-btn" style={{ marginLeft: 8 }} onClick={() => setViewing(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
