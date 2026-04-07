import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext';
import LoginPage from './pages/LoginPage';
import POSPage from './pages/POSPage';
import InventoryPage from './pages/InventoryPage';
import DashboardPage from './pages/DashboardPage';
import SalesPage from './pages/SalesPage';
import UsersPage from './pages/UsersPage';
import AlertsPage from './pages/AlertsPage';
import SettingsPage from './pages/SettingsPage';
import AppLayout from './components/AppLayout';

function AuthenticatedRoutes() {
  const { currentUser } = useApp();

  if (!currentUser) return <LoginPage />;

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
        {isAdmin && <Route path="/users" element={<UsersPage />} />}
        <Route path="/alerts" element={<AlertsPage />} />
        {isAdmin && <Route path="/settings" element={<SettingsPage />} />}
        <Route path="*" element={<Navigate to={defaultPath} replace />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<AuthenticatedRoutes />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
