import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, ClipboardList, Users, LogOut, AlertTriangle, Settings, Building2, Wifi, WifiOff, RefreshCw
} from 'lucide-react';

const adminNav = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'POS', path: '/pos', icon: ShoppingCart },
  { label: 'Inventory', path: '/inventory', icon: Package },
  { label: 'Sales History', path: '/sales', icon: ClipboardList },
  { label: 'Branches', path: '/branches', icon: Building2 },
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
  const { currentUser, logout, isOnline, pendingSyncs, lastSync, syncNow, branches, currentBranchId, setCurrentBranchId } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [time, setTime] = useState(new Date());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const nav = currentUser?.role === 'admin' ? adminNav : cashierNav;
  const currentBranch = branches.find(b => b.id === currentBranchId);

  const handleSync = async () => {
    setSyncing(true);
    await syncNow();
    setSyncing(false);
  };

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

        {/* Branch selector for admin */}
        {currentUser?.role === 'admin' && branches.length > 1 && (
          <div style={{ padding: '6px 8px', borderBottom: '1px solid hsl(210 15% 78%)', background: 'hsl(210 10% 93%)' }}>
            <select
              className="win7-input"
              style={{ width: '100%', fontSize: 11 }}
              value={currentBranchId || ''}
              onChange={e => setCurrentBranchId(e.target.value || null)}
            >
              <option value="">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>👤 {currentUser?.name} ({currentUser?.role})</span>
            {currentBranch && <span style={{ color: '#666' }}>📍 {currentBranch.name}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Sync status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {isOnline ? (
                <Wifi size={14} style={{ color: 'hsl(120 45% 42%)' }} />
              ) : (
                <WifiOff size={14} style={{ color: 'hsl(0 70% 50%)' }} />
              )}
              <span style={{ color: isOnline ? 'hsl(120 45% 42%)' : 'hsl(0 70% 50%)', fontWeight: 600 }}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
              {pendingSyncs > 0 && (
                <span style={{ background: 'hsl(40 90% 50%)', color: '#000', padding: '1px 6px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>
                  {pendingSyncs} pending
                </span>
              )}
              <button
                className="win7-btn"
                style={{ padding: '1px 6px', marginLeft: 2 }}
                onClick={handleSync}
                disabled={!isOnline || syncing}
                title="Sync now"
              >
                <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
              </button>
            </div>
            <span>{time.toLocaleDateString()} — {time.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Offline banner */}
        {!isOnline && (
          <div style={{
            background: 'hsl(40 90% 85%)',
            borderBottom: '1px solid hsl(40 90% 60%)',
            padding: '4px 14px',
            fontSize: 11,
            fontWeight: 600,
            color: 'hsl(40 50% 25%)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <WifiOff size={12} />
            Working offline — changes will sync when connection is restored
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16, background: 'hsl(210 20% 92%)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
