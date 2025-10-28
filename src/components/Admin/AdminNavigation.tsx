import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  User,
  LogOut,
  Shield,
  Settings,
  Bell,
  ArrowLeft,
  FileText,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminNavigationProps {
  activePage: string;
  onPageChange: (page: string) => void;
  onBackToDashboard?: () => void;
}

const navigationItems = [
  { id: 'expiry-dashboard', label: 'Expiry Dashboard', icon: Calendar, permission: 'HR' },
  { id: 'user-management', label: 'User Management', icon: Users, permission: 'Admin' },
  { id: 'permit-requests', label: 'Zawil Requests', icon: FileText, permission: 'HR' },
  { id: 'zawil-pdf-uploader', label: 'Zawil PDF Uploader', icon: Upload, permission: 'HR' },
  { id: 'zawil-excel-uploader', label: 'Zawil Excel Uploader', icon: FileSpreadsheet, permission: 'HR' },
  { id: 'profile', label: 'Profile', icon: User, permission: null },
  { id: 'notifications', label: 'Notifications', icon: Bell, permission: 'HR' },
  { id: 'settings', label: 'Settings', icon: Settings, permission: 'Admin' },
];

export const AdminNavigation: React.FC<AdminNavigationProps> = ({ 
  activePage, 
  onPageChange,
  onBackToDashboard
}) => {
  const { state, logout, checkPermission } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleBackToDashboard = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    } else {
      window.history.pushState({}, '', '/');
      window.location.reload();
    }
  };

  return (
    <nav className="bg-white border-r border-gray-200 shadow-sm h-full">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
            <p className="text-xs text-gray-500">HR Management System</p>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mb-6">
          <button
            onClick={handleBackToDashboard}
            className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors text-gray-700 hover:bg-gray-50 border border-gray-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
        </div>
        {/* User Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              {state.user?.profilePicture ? (
                <img
                  src={state.user.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{state.user?.username}</p>
              <p className="text-xs text-gray-600">{state.user?.role.name}</p>
            </div>
          </div>
        </div>
        
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const hasPermission = !item.permission || checkPermission(item.permission, 'read');
            
            if (!hasPermission) return null;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onPageChange(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors text-gray-700 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
};