import React from 'react';
import { Building, User, Briefcase, FileText, Phone, Award, BarChart3, Grid3X3, TrendingUp, LogOut, Search, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NavigationProps {
  activePage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'search', label: 'Search Employees', icon: Search },
  { id: 'analytics', label: 'Advanced Analytics', icon: TrendingUp },
  { id: 'excel', label: 'Excel View', icon: Grid3X3 },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'companies', label: 'Companies', icon: Building },
  { id: 'employees', label: 'Employees', icon: User },
  { id: 'job-info', label: 'Job Information', icon: Briefcase },
  { id: 'documents', label: 'Documents', icon: Award },
  { id: 'emergency', label: 'Emergency Contacts', icon: Phone },
  { id: 'skills', label: 'Skills & Experience', icon: Award },
];

export const Navigation: React.FC<NavigationProps> = ({ activePage, onPageChange, onLogout }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <nav className="bg-white border-r border-gray-200 shadow-sm">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <Building className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Employee DB</h1>
            <p className="text-sm text-gray-500">HR Management System</p>
          </div>
        </div>
        
        {/* Admin Panel Link */}
        <div className="mb-6">
          <a
            href="?admin=true"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, '', '?admin=true');
              window.location.reload();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors text-blue-700 hover:bg-blue-50 border border-blue-200"
          >
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="font-medium">Admin Panel</span>
          </a>
        </div>
        
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            
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