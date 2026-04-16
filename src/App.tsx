import { useState, useEffect } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppProvider, useApp } from './store/AppContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import POSPage from './pages/POSPage';
import InventoryPage from './pages/InventoryPage';
import DashboardPage from './pages/DashboardPage';
import SalesPage from './pages/SalesPage';
import UsersPage from './pages/UsersPage';
import AlertsPage from './pages/AlertsPage';
import SettingsPage from './pages/SettingsPage';
import BranchesPage from './pages/BranchesPage';
import AppLayout from './components/AppLayout';

function AuthenticatedRoutes() {
  const { currentUser } = useApp();

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const defaultPath = isAdmin ? '/dashboard' : '/pos';

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to={defaultPath} replace />} />
        {isAdmin && <Route path="/dashboard" element={<DashboardPage />} />}
        <Route path="/pos" element={<POSPage />} />
        {isAdmin && <Route path="/inventory" element={<InventoryPage />} />}
        <Route path="/sales" element={<SalesPage />} />
        {isAdmin && <Route path="/branches" element={<BranchesPage />} />}
        {isAdmin && <Route path="/users" element={<UsersPage />} />}
        <Route path="/alerts" element={<AlertsPage />} />
        {isAdmin && <Route path="/settings" element={<SettingsPage />} />}
        <Route path="*" element={<Navigate to={defaultPath} replace />} />
      </Routes>
    </AppLayout>
  );
}

function AuthGate() {
  const { currentUser, setAuthUser } = useApp();
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Fetch profile
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) {
          setAuthUser({
            id: profile.id,
            name: profile.name,
            role: profile.role as 'admin' | 'cashier',
            branchId: profile.branch_id || undefined,
            email: session.user.email || '',
          });
        }
      } else {
        setAuthUser(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) {
          setAuthUser({
            id: profile.id,
            name: profile.name,
            role: profile.role as 'admin' | 'cashier',
            branchId: profile.branch_id || undefined,
            email: session.user.email || '',
          });
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, hsl(210 40% 55%) 0%, hsl(210 50% 35%) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: 16,
      }}>
        Loading...
      </div>
    );
  }

  if (!currentUser) {
    if (authPage === 'register') {
      return <RegisterPage onRegistered={() => setAuthPage('login')} onGoToLogin={() => setAuthPage('login')} />;
    }
    return <LoginPage onGoToRegister={() => setAuthPage('register')} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<AuthenticatedRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AuthGate />
    </AppProvider>
  );
}
