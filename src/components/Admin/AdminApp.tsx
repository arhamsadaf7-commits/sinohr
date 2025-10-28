import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminLoginForm } from '../Auth/AdminLoginForm';
import { AdminNavigation } from './AdminNavigation';
import { AdminProfile } from './AdminProfile';
import { ExpiryDashboard } from './ExpiryDashboard';
import { UserManagement } from './UserManagement';
import { PermitRequestsPage } from './PermitRequestsPage';
import { EmployeeProvider } from '../../context/EmployeeContext';

interface AdminAppProps {
  onBackToDashboard?: () => void;
}

export const AdminApp: React.FC<AdminAppProps> = ({ onBackToDashboard }) => {
  const { state } = useAuth();
  const [activePage, setActivePage] = useState('expiry-dashboard');

  const handleBackToDashboard = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    } else {
      window.history.pushState({}, '', '/');
      window.location.reload();
    }
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return <AdminLoginForm />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'expiry-dashboard':
        return <ExpiryDashboard />;
      case 'user-management':
        return <UserManagement />;
      case 'permit-requests':
        return <PermitRequestsPage />;
      case 'profile':
        return <AdminProfile />;
      case 'notifications':
        return (
          <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
              <p className="text-gray-600 mb-8">Manage notification settings and alerts</p>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <p className="text-gray-500">Notification system coming soon...</p>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
              <p className="text-gray-600 mb-8">System configuration and preferences</p>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <p className="text-gray-500">Settings panel coming soon...</p>
              </div>
            </div>
          </div>
        );
      default:
        return <ExpiryDashboard />;
    }
  };

  return (
    <EmployeeProvider>
      <div className="flex h-screen bg-gray-50">
        <div className="w-64 flex-shrink-0">
          <AdminNavigation 
            activePage={activePage} 
            onPageChange={setActivePage}
            onBackToDashboard={handleBackToDashboard}
          />
        </div>
        <div className="flex-1 overflow-auto">
          {renderPage()}
        </div>
      </div>
    </EmployeeProvider>
  );
};