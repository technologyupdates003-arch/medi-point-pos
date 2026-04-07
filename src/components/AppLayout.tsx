import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, ClipboardList, Users, LogOut, AlertTriangle, Settings
} from 'lucide-react';

const adminNav = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'POS', path: '/pos', icon: ShoppingCart },
  { label: 'Inventory', path: '/inventory', icon: Package },
  { label: 'Sales History', path: '/sales', icon: ClipboardList },
  { label: 'Users', path: '/users', icon: Users },
  { label: 'Alerts', path: '/alerts', icon: AlertTriangle },
  { label: 'Settings', path: '/settings', icon: Settings },
];

const cashierNav = [
  { label: 'POS', path: '/pos', icon: ShoppingCart },
  { label: 'Sales History', path: '/sales', icon: ClipboardList },
  { label: 'Alerts', path: '/alerts', icon: AlertTriangle },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const nav = currentUser?.role === 'admin' ? adminNav : cashierNav;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div className="win7-sidebar" style={{ width: 190, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{
          padding: '14px 12px',
          borderBottom: '1px solid hsl(210 15% 78%)',
          background: 'linear-gradient(180deg, hsl(210 55% 55%) 0%, hsl(210 65% 42%) 100%)',
          color: 'white',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: 14,
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
        }}>
          💊 PharmaPOS
        </div>
        <div style={{ flex: 1, paddingTop: 6 }}>
          {nav.map(item => (
            <div
              key={item.path}
              className={`win7-sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
        <div
          className="win7-sidebar-item"
          style={{ borderTop: '1px solid hsl(210 15% 78%)' }}
          onClick={() => { logout(); navigate('/'); }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{
          height: 36,
          background: 'linear-gradient(180deg, hsl(210 20% 94%) 0%, hsl(210 15% 88%) 100%)',
          borderBottom: '1px solid hsl(210 15% 78%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
          fontSize: 12,
          flexShrink: 0,
        }}>
          <span>👤 {currentUser?.name} ({currentUser?.role})</span>
          <span>{time.toLocaleDateString()} — {time.toLocaleTimeString()}</span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16, background: 'hsl(210 20% 92%)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
