import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { AuthProvider } from './context/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
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
import { ZawilUploader } from './components/ZawilUploader/ZawilUploader';
import { ZawilExcelUploader } from './components/ZawilUploader/ZawilExcelUploader';
import { Toaster } from 'react-hot-toast';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    // Check if we should show admin panel from URL
    const checkAdminPanel = () => {
      const isAdminPanel = window.location.pathname === '/admin' || 
                          window.location.hash === '#admin' ||
                          window.location.search.includes('admin=true');
      setShowAdminPanel(isAdminPanel);
    };
    
    checkAdminPanel();
    
    // Listen for URL changes
    const handlePopState = () => {
      checkAdminPanel();
    };
    
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', checkAdminPanel);
    
    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', checkAdminPanel);
    };
  }, []);

  const handleAuthSuccess = () => {
    // User state will be updated by the auth listener
  };

  const handleLogout = () => {
    setUser(null);
    setActivePage('dashboard');
    setShowAdminPanel(false);
    // Clear admin panel from URL
    window.history.pushState({}, '', window.location.pathname);
  };

  if (showAdminPanel) {
    return <AuthProvider><AdminApp /></AuthProvider>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onSuccess={handleAuthSuccess} />;
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
      case 'zawil-uploader':
        return <ZawilUploader />;
      case 'zawil-excel-uploader':
        return <ZawilExcelUploader />;
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