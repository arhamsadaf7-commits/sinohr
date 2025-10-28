import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { useAuth } from './context/AuthContext';
import LoginForm from './components/Auth/LoginForm';
import { SpreadsheetView } from './components/ExcelView/SpreadsheetView';
import { AdvancedDashboard } from './components/Analytics/AdvancedDashboard';
import { ReportsPage } from './components/Reports/ReportsPage';
import { EmployeeProvider } from './context/EmployeeContext';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { EmployeeSearchPage } from './components/Search/EmployeeSearchPage';
import { AdminApp } from './components/Admin/AdminApp';
import { CompanyPage } from './components/CompanyPage';
import { EmployeePage } from './components/EmployeePage';
import { JobInfoPage } from './components/JobInfoPage';
import { DocumentsPage } from './components/DocumentsPage';
import { EmergencyContactPage } from './components/EmergencyContactPage';
import { SkillsPage } from './components/SkillsPage';
import { PublicPermitRequestForm } from './components/PublicPermitRequestForm';
import { Toaster } from 'react-hot-toast';

function App() {
  const { state: authState, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    const checkRouting = () => {
      const path = window.location.pathname;

      if (path === '/public/permit-request') {
        setActivePage('public-permit-form');
      } else if (path === '/admin' || window.location.hash === '#admin' || window.location.search.includes('admin=true')) {
        setShowAdminPanel(true);
      }
    };

    checkRouting();

    const handlePopState = () => {
      checkRouting();
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', checkRouting);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', checkRouting);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setActivePage('dashboard');
    setShowAdminPanel(false);
    // Clear admin panel from URL
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleBackToDashboard = () => {
    setShowAdminPanel(false);
    setActivePage('dashboard');
    // Update URL without triggering logout
    window.history.pushState({}, '', '/');
  };

  if (activePage === 'public-permit-form') {
    return (
      <>
        <Toaster position="top-right" />
        <PublicPermitRequestForm />
      </>
    );
  }

  if (showAdminPanel) {
    return <AdminApp onBackToDashboard={handleBackToDashboard} />;
  }

  if (authState.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return <LoginForm />;
  }

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard setActivePage={setActivePage} />;
      case 'search':
        return <EmployeeSearchPage />;
      case 'analytics':
        return <AdvancedDashboard />;
      case 'excel':
        return <SpreadsheetView />;
      case 'reports':
        return <ReportsPage />;
      case 'companies':
        return <CompanyPage />;
      case 'employees':
        return <EmployeePage />;
      case 'job-info':
        return <JobInfoPage />;
      case 'documents':
        return <DocumentsPage />;
      case 'emergency':
        return <EmergencyContactPage />;
      case 'skills':
        return <SkillsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <EmployeeProvider>
      <Toaster position="top-right" />
      <div className="flex h-screen bg-gray-50">
        <div className="w-64 flex-shrink-0">
          <Navigation 
            activePage={activePage} 
            onPageChange={setActivePage}
            onLogout={handleLogout}
          />
        </div>
        <div className="flex-1 overflow-auto">
          {renderPage()}
        </div>
      </div>
    </EmployeeProvider>
  );
}

export default App;