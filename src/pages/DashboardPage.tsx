import { useApp } from '../store/AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(210,60%,50%)', 'hsl(120,45%,42%)', 'hsl(40,90%,50%)', 'hsl(0,70%,50%)', 'hsl(280,50%,50%)'];

export default function DashboardPage() {
  const { products, transactions } = useApp();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const todayTx = transactions.filter(t => t.date.startsWith(todayStr));
  const todayRevenue = todayTx.reduce((s, t) => s + t.total, 0);
  const totalRevenue = transactions.reduce((s, t) => s + t.total, 0);
  const lowStock = products.filter(p => p.stock < 10);
  const expired = products.filter(p => new Date(p.expiryDate) < now);

  // Daily sales for last 7 days
  const dailySales = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split('T')[0];
    const total = transactions.filter(t => t.date.startsWith(ds)).reduce((s, t) => s + t.total, 0);
    return { day: ds.slice(5), total };
  });

  // Top products
  const productSales: Record<string, number> = {};
  transactions.forEach(t => t.items.forEach(item => {
    productSales[item.name] = (productSales[item.name] || 0) + item.qty;
  }));
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => ({ name: name.length > 15 ? name.slice(0, 15) + '…' : name, qty }));

  const cards = [
    { label: "Today's Sales", value: todayTx.length, color: 'hsl(210,60%,50%)' },
    { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, color: 'hsl(120,45%,42%)' },
    { label: 'Low Stock Items', value: lowStock.length, color: 'hsl(40,90%,50%)' },
    { label: 'Expired Products', value: expired.length, color: 'hsl(0,70%,50%)' },
  ];

  return (
    <div>
      <div className="win7-titlebar">📊 Admin Dashboard</div>
      <div className="win7-panel" style={{ borderTop: 'none', padding: 16 }}>
        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {cards.map(c => (
            <div key={c.label} className="win7-card" style={{ borderLeft: `4px solid ${c.color}` }}>
              <div style={{ fontSize: 11, color: '#666' }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div className="win7-titlebar" style={{ fontSize: 12 }}>Daily Sales (7 Days)</div>
            <div className="win7-panel" style={{ borderTop: 'none', padding: 12, height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySales}>
                  <XAxis dataKey="day" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                  <Bar dataKey="total" fill="hsl(210,60%,50%)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <div className="win7-titlebar" style={{ fontSize: 12 }}>Top Selling Products</div>
            <div className="win7-panel" style={{ borderTop: 'none', padding: 12, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={topProducts} dataKey="qty" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name} fontSize={10}>
                    {topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
