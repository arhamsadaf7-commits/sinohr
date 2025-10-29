import React, { useState, useEffect } from 'react';
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
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  UserCog,
  Lock,
  Cog,
  Home
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminNavigationProps {
  activePage: string;
  onPageChange: (page: string) => void;
  onBackToDashboard?: () => void;
}

const navigationItems = [
  { id: 'supplier-dashboard', label: 'Dashboard', icon: Home, permission: null, showOnlyForRoles: ['Supplier'], hideForRoles: [] },
  { id: 'expiry-dashboard', label: 'Expiry Dashboard', icon: Calendar, permission: 'Expiry Dashboard', showOnlyForRoles: [], hideForRoles: ['Supplier'] },
  { id: 'user-management', label: 'User Management', icon: Users, permission: 'Admin', showOnlyForRoles: [], hideForRoles: [] },
  { id: 'permit-requests', label: 'Zawil Requests', icon: FileText, permission: 'Zawil Requests', showOnlyForRoles: [], hideForRoles: [] },
  { id: 'zawil-pdf-uploader', label: 'Zawil PDF Uploader', icon: Upload, permission: 'HR', showOnlyForRoles: [], hideForRoles: [] },
  { id: 'zawil-excel-uploader', label: 'Zawil Excel Uploader', icon: FileSpreadsheet, permission: 'HR', showOnlyForRoles: [], hideForRoles: [] },
  { id: 'profile', label: 'Profile', icon: User, permission: null, showOnlyForRoles: [], hideForRoles: [] },
  { id: 'notifications', label: 'Notifications', icon: Bell, permission: 'HR', showOnlyForRoles: [], hideForRoles: [] },
];

const settingsSubmenuItems = [
  { id: 'settings-users', label: 'User Management', icon: UserCog, permission: 'Admin' },
  { id: 'settings-permissions', label: 'Module Permissions', icon: Lock, permission: 'Admin' },
  { id: 'settings-config', label: 'System Config', icon: Cog, permission: 'Admin' },
];

export const AdminNavigation: React.FC<AdminNavigationProps> = ({
  activePage,
  onPageChange,
  onBackToDashboard
}) => {
  const { state, logout, checkPermission } = useAuth();
  const [settingsExpanded, setSettingsExpanded] = useState(activePage.startsWith('settings-'));

  useEffect(() => {
    if (activePage.startsWith('settings-')) {
      setSettingsExpanded(true);
    }
  }, [activePage]);

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
            const userRole = state.user?.role.name;
            const isHiddenForRole = userRole && item.hideForRoles.includes(userRole);
            const showOnlyForThisRole = item.showOnlyForRoles.length > 0 && userRole && item.showOnlyForRoles.includes(userRole);
            const shouldShowForAll = item.showOnlyForRoles.length === 0;

            if (!hasPermission || isHiddenForRole) return null;
            if (!shouldShowForAll && !showOnlyForThisRole) return null;

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

          {checkPermission('Admin', 'read') && (
            <li>
              <button
                onClick={() => setSettingsExpanded(!settingsExpanded)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all duration-200
                  ${activePage.startsWith('settings-')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Settings className={`w-5 h-5 ${activePage.startsWith('settings-') ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="font-medium flex-1">Settings</span>
                {settingsExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {settingsExpanded && (
                <ul className="mt-2 ml-4 space-y-1">
                  {settingsSubmenuItems.map((subItem) => {
                    const SubIcon = subItem.icon;
                    const isActive = activePage === subItem.id;
                    const hasPermission = !subItem.permission || checkPermission(subItem.permission, 'read');

                    if (!hasPermission) return null;

                    return (
                      <li key={subItem.id}>
                        <button
                          onClick={() => onPageChange(subItem.id)}
                          className={`
                            w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg transition-all duration-200 text-sm
                            ${isActive
                              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }
                          `}
                        >
                          <SubIcon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                          <span className="font-medium">{subItem.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          )}
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