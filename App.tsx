import React from 'react';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './views/Login';
import { AdminDashboard } from './views/AdminDashboard';
import { EmployeeDashboard } from './views/EmployeeDashboard';

const AppContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout>
      {user?.role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />}
    </Layout>
  );
};

export default function App() {
  return (
    <DataProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </DataProvider>
  );
}