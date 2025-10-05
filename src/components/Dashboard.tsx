import React from 'react';
import { useEmployee } from '../context/EmployeeContext';
import { Users, Building, AlertTriangle, Calendar, TrendingUp, FileText, Award, Phone } from 'lucide-react';

export const Dashboard: React.FC<{ setActivePage?: (page: string) => void }> = ({ setActivePage }) => {
  const { state } = useEmployee();

  const totalEmployees = state.employees.length;
  const totalCompanies = state.companies.length;
  const totalZawilPermits = state.zawilPermits.length;
  
  // Calculate expiring documents (within 30 days)
  const expiringDocuments = state.documents.filter(doc => {
    const expiryDate = new Date(doc.iqamaExpiryDate || doc.passportExpiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
  }).length;

  // Calculate expiring Zawil permits (within 30 days)
  const expiringZawilPermits = state.zawilPermits.filter(permit => {
    const expiryDate = new Date(permit.expiry_date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
  }).length;
  // Recent additions (last 7 days)
  const recentEmployees = state.employees.filter(emp => {
    const jobInfo = state.jobInfos.find(j => j.employeeId === emp.id);
    if (!jobInfo) return false;
    const joiningDate = new Date(jobInfo.joiningDate);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return joiningDate >= thirtyDaysAgo;
  }).length;

  // Calculate completion rates
  const completionRates = {
    jobInfo: (state.jobInfos.length / Math.max(state.employees.length, 1)) * 100,
    documents: (state.documents.length / Math.max(state.employees.length, 1)) * 100,
    emergency: (state.emergencyContacts.length / Math.max(state.employees.length, 1)) * 100,
    skills: (state.skillsExperiences.length / Math.max(state.employees.length, 1)) * 100,
  };
  const stats = [
    {
      title: 'Total Employees',
      value: totalEmployees,
      icon: Users,
      color: 'blue',
      change: `+${recentEmployees} this month`
    },
    {
      title: 'Companies',
      value: totalCompanies,
      icon: Building,
      color: 'emerald',
      change: 'Active branches'
    },
    {
      title: 'Zawil Permits',
      value: totalZawilPermits,
      icon: FileText,
      color: 'purple',
      change: `${expiringZawilPermits} expiring soon`
    },
    {
      title: 'Other Documents',
      value: expiringDocuments,
      icon: AlertTriangle,
      color: 'amber',
      change: 'Next 30 days'
    }
  ];

  const recentEmployeesList = state.employees
    .slice(-5)
    .map(emp => {
      const company = state.companies.find(c => c.id === emp.companyId);
      const jobInfo = state.jobInfos.find(j => j.employeeId === emp.id);
      return { ...emp, company, jobInfo };
    });

  // Recent Zawil permits
  const recentZawilPermits = state.zawilPermits
    .slice(-5)
    .map(permit => ({
      ...permit,
      daysUntilExpiry: Math.ceil((new Date(permit.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    }));
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Overview of your employee database</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const colorClasses = {
              blue: 'bg-blue-500 text-white',
              emerald: 'bg-emerald-500 text-white',
              amber: 'bg-amber-500 text-white',
              purple: 'bg-purple-500 text-white'
            };

            return (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-xs text-gray-500">{stat.change}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion Rates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Data Completion Rates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Job Information', rate: completionRates.jobInfo, icon: FileText },
              { label: 'Documents', rate: completionRates.documents, icon: Award },
              { label: 'Emergency Contacts', rate: completionRates.emergency, icon: Phone },
              { label: 'Skills & Experience', rate: completionRates.skills, icon: Award },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="relative w-16 h-16 mx-auto mb-2">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="2"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeDasharray={`${item.rate}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-900">{Math.round(item.rate)}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Zawil Permits */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Zawil Permits</h2>
            <div className="space-y-3">
              {recentZawilPermits.length > 0 ? (
                recentZawilPermits.map((permit) => (
                  <div key={permit.permit_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{permit.english_name}</p>
                      <p className="text-sm text-gray-600">{permit.permit_type}</p>
                      <p className="text-xs text-gray-500">{permit.zawil_permit_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Expires: {new Date(permit.expiry_date).toLocaleDateString()}</p>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        permit.daysUntilExpiry < 0 ? 'bg-red-100 text-red-800' :
                        permit.daysUntilExpiry <= 30 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {permit.daysUntilExpiry < 0 ? 'Expired' : 
                         permit.daysUntilExpiry <= 30 ? 'Expiring Soon' : 'Valid'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No Zawil permits uploaded yet</p>
              )}
            </div>
          </div>

          {/* Recent Employees */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Employees</h2>
            <div className="space-y-3">
              {recentEmployeesList.length > 0 ? (
                recentEmployeesList.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{employee.fullName}</p>
                      <p className="text-sm text-gray-600">{employee.jobInfo?.jobTitle || 'No job info'}</p>
                      <p className="text-xs text-gray-500">{employee.company?.name || 'No company'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{employee.id}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No employees added yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button 
                onClick={() => setActivePage?.('search')}
                className="w-full p-4 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
              >
                <div className="font-medium text-purple-900">Search Employees</div>
                <div className="text-sm text-purple-700">Find and generate CV documents</div>
              </button>
              <button 
                onClick={() => setActivePage?.('zawil-excel-uploader')}
                className="w-full p-4 text-left bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
              >
                <div className="font-medium text-indigo-900">Upload Zawil Data</div>
                <div className="text-sm text-indigo-700">Import Zawil permits from Excel</div>
              </button>
              <button 
                onClick={() => setActivePage('employees')}
                className="w-full p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
              >
                <div className="font-medium text-blue-900">Add New Employee</div>
                <div className="text-sm text-blue-700">Create a complete employee profile</div>
              </button>
              <button 
                onClick={() => setActivePage('companies')}
                className="w-full p-4 text-left bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
              >
                <div className="font-medium text-emerald-900">Add Company</div>
                <div className="text-sm text-emerald-700">Register a new company or branch</div>
              </button>
              <button 
                onClick={() => setActivePage('reports')}
                className="w-full p-4 text-left bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
              >
                <div className="font-medium text-amber-900">Export Data</div>
                <div className="text-sm text-amber-700">Download employee database</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};