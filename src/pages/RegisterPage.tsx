import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  onRegistered: () => void;
  onGoToLogin: () => void;
}

export default function RegisterPage({ onRegistered, onGoToLogin }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check if this is the first user (will become admin)
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const isFirstUser = (count || 0) === 0;

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: isFirstUser ? 'admin' : 'cashier',
          },
        },
      });

      if (signUpError) throw signUpError;

      // If first user, update business name
      if (isFirstUser && businessName.trim()) {
        await supabase.from('business_settings').update({
          business_name: businessName.trim(),
        }).eq('id', (await supabase.from('business_settings').select('id').limit(1).single()).data?.id || '');
      }

      onRegistered();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
      <div style={{ width: 400 }}>
        <div className="win7-titlebar" style={{ textAlign: 'center', fontSize: 15 }}>
          💊 PharmaPOS — Business Registration
        </div>
        <div className="win7-panel" style={{ padding: 24, borderTop: 'none', borderRadius: '0 0 2px 2px' }}>
          <div style={{ marginBottom: 16, padding: '8px 12px', background: 'hsl(210 30% 93%)', borderRadius: 3, fontSize: 11, color: 'hsl(210 30% 35%)' }}>
            <b>First registration</b> creates the Admin account. Additional staff can be added from the dashboard.
          </div>
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 3, fontWeight: 600, fontSize: 12 }}>Business Name</label>
              <input
                className="win7-input"
                style={{ width: '100%' }}
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="Your Pharmacy Name"
                required
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 3, fontWeight: 600, fontSize: 12 }}>Your Full Name</label>
              <input
                className="win7-input"
                style={{ width: '100%' }}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 3, fontWeight: 600, fontSize: 12 }}>Email</label>
              <input
                className="win7-input"
                type="email"
                style={{ width: '100%' }}
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="admin@pharmacy.com"
                required
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 3, fontWeight: 600, fontSize: 12 }}>Password</label>
              <input
                className="win7-input"
                type="password"
                style={{ width: '100%' }}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="Min 6 characters"
                required
                minLength={6}
              />
            </div>
            {error && <div style={{ color: 'hsl(0 70% 50%)', marginBottom: 10, fontSize: 12 }}>{error}</div>}
            <button
              type="submit"
              className="win7-btn win7-btn-primary"
              style={{ width: '100%', padding: '8px 16px', fontSize: 14 }}
              disabled={loading}
            >
              {loading ? 'Registering...' : '🏥 Register Business'}
            </button>
          </form>
          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <button
              onClick={onGoToLogin}
              style={{ background: 'none', border: 'none', color: 'hsl(210 60% 45%)', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}
            >
              Already registered? Sign in
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
