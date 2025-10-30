import React, { useState } from 'react';
import { Building, User, Briefcase, FileText, Phone, Award, BarChart3, Grid3X3, TrendingUp, LogOut, Search, Shield, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NavigationProps {
  activePage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  children?: MenuItem[];
}

const navigationItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  {
    id: 'employees',
    label: 'Employee',
    icon: User,
    children: [
      { id: 'employees', label: 'Employee List', icon: User },
      { id: 'search', label: 'Search Employees', icon: Search },
      { id: 'excel', label: 'Excel View', icon: Grid3X3 },
      { id: 'job-info', label: 'Job Information', icon: Briefcase },
      { id: 'documents', label: 'Documents', icon: FileText },
      { id: 'emergency', label: 'Emergency Contacts', icon: Phone },
      { id: 'skills', label: 'Skills & Experience', icon: Award },
    ]
  },
  { id: 'analytics', label: 'Advanced Analytics', icon: TrendingUp },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'companies', label: 'Companies', icon: Building },
];

export const Navigation: React.FC<NavigationProps> = ({ activePage, onPageChange, onLogout }) => {
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({
    employees: true
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const toggleMenu = (id: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const Icon = item.icon;
    const isActive = activePage === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus[item.id];

    return (
      <li key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleMenu(item.id);
            } else {
              onPageChange(item.id);
            }
          }}
          className={`
            w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-all duration-200
            ${level > 0 ? 'pl-8' : ''}
            ${isActive && !hasChildren
              ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 ml-1'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }
          `}
        >
          <Icon className={`w-5 h-5 ${isActive && !hasChildren ? 'text-blue-600' : 'text-gray-500'}`} />
          <span className="font-medium flex-1">{item.label}</span>
          {hasChildren && (
            isExpanded ?
              <ChevronDown className="w-4 h-4 text-gray-500" /> :
              <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>

        {hasChildren && isExpanded && (
          <ul className="mt-1 space-y-1">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav className="bg-white border-r border-gray-200 shadow-sm overflow-y-auto">
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
          {navigationItems.map((item) => renderMenuItem(item))}
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
