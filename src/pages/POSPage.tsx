import { useState, useRef } from 'react';
import { useApp } from '../store/AppContext';
import { Transaction } from '../store/mockData';
import { Search, Plus, Minus, X, Printer } from 'lucide-react';

export default function POSPage() {
  const { products, cart, addToCart, removeFromCart, updateCartQty, clearCart, completeSale, cartTotal } = useApp();
  const [search, setSearch] = useState('');
  const [cashPaid, setCashPaid] = useState('');
  const [receipt, setReceipt] = useState<Transaction | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search)
  );

  const handleComplete = () => {
    const cash = parseFloat(cashPaid);
    if (isNaN(cash) || cash < cartTotal) return;
    const tx = completeSale(cash);
    if (tx) {
      setReceipt(tx);
      setCashPaid('');
      // play a beep
      try {
        const ac = new AudioContext();
        const o = ac.createOscillator();
        o.frequency.value = 800;
        o.connect(ac.destination);
        o.start();
        o.stop(ac.currentTime + 0.15);
      } catch {}
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filtered.length === 1) {
      addToCart(filtered[0]);
      setSearch('');
      searchRef.current?.focus();
    }
  };

  const balance = parseFloat(cashPaid) - cartTotal;

  return (
    <div style={{ display: 'flex', gap: 12, height: 'calc(100vh - 68px)' }}>
      {/* Left: Product search */}
      <div style={{ width: 340, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div className="win7-titlebar">Product Search</div>
        <div className="win7-panel" style={{ flex: 1, borderTop: 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 8, top: 8, color: '#999' }} />
              <input
                ref={searchRef}
                className="win7-input"
                placeholder="Search name or scan barcode..."
                style={{ width: '100%', paddingLeft: 28 }}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 8px' }}>
            {filtered.map(p => {
              const isExpired = new Date(p.expiryDate) < new Date();
              return (
                <div key={p.id} style={{
                  padding: '6px 8px',
                  borderBottom: '1px solid hsl(210 10% 90%)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: isExpired ? 0.5 : 1,
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#666' }}>
                      ${p.sellingPrice.toFixed(2)} · Stock: {p.stock}
                      {isExpired && <span className="badge-expired" style={{ marginLeft: 6 }}>EXPIRED</span>}
                    </div>
                  </div>
                  <button
                    className="win7-btn win7-btn-primary"
                    style={{ padding: '2px 10px', fontSize: 12 }}
                    onClick={() => addToCart(p)}
                    disabled={p.stock <= 0 || isExpired}
                  >
                    Add
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Cart + Payment */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="win7-titlebar">🛒 Cart</div>
        <div className="win7-panel" style={{ flex: 1, borderTop: 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <table className="win7-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ width: 80 }}>Price</th>
                  <th style={{ width: 120 }}>Qty</th>
                  <th style={{ width: 80 }}>Subtotal</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 30, color: '#999' }}>Cart is empty</td></tr>
                ) : cart.map(c => (
                  <tr key={c.product.id}>
                    <td>{c.product.name}</td>
                    <td>${c.product.sellingPrice.toFixed(2)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button className="win7-btn" style={{ padding: '1px 6px' }} onClick={() => updateCartQty(c.product.id, c.quantity - 1)}><Minus size={12} /></button>
                        <span style={{ width: 30, textAlign: 'center' }}>{c.quantity}</span>
                        <button className="win7-btn" style={{ padding: '1px 6px' }} onClick={() => updateCartQty(c.product.id, c.quantity + 1)}><Plus size={12} /></button>
                      </div>
                    </td>
                    <td>${(c.product.sellingPrice * c.quantity).toFixed(2)}</td>
                    <td><button className="win7-btn" style={{ padding: '1px 6px' }} onClick={() => removeFromCart(c.product.id)}><X size={12} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment */}
          <div style={{ borderTop: '1px solid hsl(210 15% 78%)', padding: 12, background: 'hsl(210 10% 95%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, marginBottom: 10 }}>
              <span>TOTAL:</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 600 }}>Cash Received</label>
                <input
                  className="win7-input"
                  style={{ width: '100%' }}
                  type="number"
                  step="0.01"
                  value={cashPaid}
                  onChange={e => setCashPaid(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleComplete(); }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 600 }}>Balance</label>
                <div style={{
                  padding: '5px 8px',
                  background: 'white',
                  border: '1px solid hsl(210 15% 78%)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: balance >= 0 ? 'hsl(120 45% 35%)' : 'hsl(0 70% 50%)',
                }}>
                  {isNaN(balance) ? '—' : `$${balance.toFixed(2)}`}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="win7-btn" onClick={clearCart} style={{ flex: 1 }}>Clear Cart</button>
              <button
                className="win7-btn win7-btn-success"
                style={{ flex: 2, padding: '8px 16px', fontWeight: 700 }}
                onClick={handleComplete}
                disabled={cart.length === 0 || isNaN(parseFloat(cashPaid)) || parseFloat(cashPaid) < cartTotal}
              >
                ✓ Complete Sale
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {receipt && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setReceipt(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', padding: 0, borderRadius: 2 }}>
            <div className="win7-titlebar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Receipt</span>
              <button onClick={() => setReceipt(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="receipt" style={{ padding: 20 }}>
              <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 14 }}>💊 PHARMACY POS</div>
              <div style={{ textAlign: 'center', fontSize: 11 }}>123 Health Street, Medical City</div>
              <div style={{ borderBottom: '1px dashed #ccc', margin: '8px 0' }} />
              <div style={{ fontSize: 11 }}>Date: {new Date(receipt.date).toLocaleString()}</div>
              <div style={{ fontSize: 11 }}>Receipt #: {receipt.id}</div>
              <div style={{ fontSize: 11 }}>Cashier: {receipt.cashier}</div>
              <div style={{ borderBottom: '1px dashed #ccc', margin: '8px 0' }} />
              <table style={{ width: '100%', fontSize: 11 }}>
                <thead>
                  <tr><th style={{ textAlign: 'left' }}>Item</th><th>Qty</th><th>Price</th><th style={{ textAlign: 'right' }}>Sub</th></tr>
                </thead>
                <tbody>
                  {receipt.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.name}</td>
                      <td style={{ textAlign: 'center' }}>{item.qty}</td>
                      <td style={{ textAlign: 'center' }}>${item.price.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>${item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ borderBottom: '1px dashed #ccc', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>TOTAL</span><span>${receipt.total.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span>Cash Paid</span><span>${receipt.cashPaid.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span>Balance</span><span>${receipt.balance.toFixed(2)}</span>
              </div>
              <div style={{ borderBottom: '1px dashed #ccc', margin: '8px 0' }} />
              <div style={{ textAlign: 'center', fontSize: 10 }}>Thank you for your purchase!</div>
            </div>
            <div style={{ padding: '8px 20px 16px', textAlign: 'center' }}>
              <button className="win7-btn win7-btn-primary" onClick={() => window.print()}>
                <Printer size={14} style={{ marginRight: 4, display: 'inline' }} /> Print
              </button>
              <button className="win7-btn" style={{ marginLeft: 8 }} onClick={() => setReceipt(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
