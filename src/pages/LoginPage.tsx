import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  onGoToRegister: () => void;
}

export default function LoginPage({ onGoToRegister }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      // Auth state change listener in App.tsx will handle navigation
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
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
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Email</label>
              <input
                className="win7-input"
                type="email"
                style={{ width: '100%' }}
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                autoFocus
                required
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
                required
              />
            </div>
            {error && <div style={{ color: 'hsl(0 70% 50%)', marginBottom: 12, fontSize: 12 }}>{error}</div>}
            <button
              type="submit"
              className="win7-btn win7-btn-primary"
              style={{ width: '100%', padding: '8px 16px', fontSize: 14 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Log In'}
            </button>
          </form>
          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <button
              onClick={onGoToRegister}
              style={{ background: 'none', border: 'none', color: 'hsl(210 60% 45%)', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}
            >
              Register new business
            </button>
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
