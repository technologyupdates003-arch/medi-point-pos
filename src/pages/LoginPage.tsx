import { useState } from 'react';
import { useApp } from '../store/AppContext';

export default function LoginPage() {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(username, password)) {
      setError('Invalid username or password');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, hsl(210 40% 55%) 0%, hsl(210 50% 35%) 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ width: 380 }}>
        <div className="win7-titlebar" style={{ textAlign: 'center', fontSize: 15 }}>
          💊 PharmaPOS — Login
        </div>
        <div className="win7-panel" style={{ padding: 30, borderTop: 'none', borderRadius: '0 0 2px 2px' }}>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Username</label>
              <input
                className="win7-input"
                style={{ width: '100%' }}
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                autoFocus
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Password</label>
              <input
                className="win7-input"
                type="password"
                style={{ width: '100%' }}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
              />
            </div>
            {error && <div style={{ color: 'hsl(0 70% 50%)', marginBottom: 12, fontSize: 12 }}>{error}</div>}
            <button type="submit" className="win7-btn win7-btn-primary" style={{ width: '100%', padding: '8px 16px', fontSize: 14 }}>
              Log In
            </button>
          </form>
          <div style={{ marginTop: 20, fontSize: 11, color: 'hsl(0 0% 50%)', textAlign: 'center' }}>
            <div><b>Admin:</b> admin / admin123</div>
            <div><b>Cashier:</b> cashier / 1234</div>
          </div>
          <div style={{ marginTop: 16, borderTop: '1px solid hsl(210 15% 85%)', paddingTop: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'hsl(0 0% 55%)' }}>POS Sponsor</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'hsl(210 40% 40%)', marginTop: 2 }}>Powered by Abancool Technology</div>
            <div style={{ fontSize: 10, color: 'hsl(0 0% 50%)' }}>0728825152 / 01116679286</div>
          </div>
        </div>
      </div>
    </div>
  );
}
