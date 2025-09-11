import React, { useMemo } from 'react';
import { useEmployee } from '../../context/EmployeeContext';
import { 
  Users, Building, Calendar, AlertTriangle, TrendingUp, 
  PieChart, BarChart3, Clock, Award, FileText 
} from 'lucide-react';

export const AdvancedDashboard: React.FC = () => {
  const { state } = useEmployee();

  const analytics = useMemo(() => {
    const totalEmployees = state.employees.length;
    const totalCompanies = state.companies.length;
    
    // Employee type distribution
    const employeeTypes = state.jobInfos.reduce((acc, job) => {
      acc[job.employeeType] = (acc[job.employeeType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Gender distribution
    const genderDistribution = state.employees.reduce((acc, emp) => {
      acc[emp.gender] = (acc[emp.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Department distribution
    const departmentDistribution = state.companies.reduce((acc, company) => {
      acc[company.department] = (acc[company.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Expiring documents
    const expiringDocs = state.documents.filter(doc => {
      const checkExpiry = (date: string) => {
        if (!date) return false;
        const expiryDate = new Date(date);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
      };
      return checkExpiry(doc.passportExpiryDate) || checkExpiry(doc.iqamaExpiryDate);
    });

    // Recent joiners (last 30 days)
    const recentJoiners = state.jobInfos.filter(job => {
      const joiningDate = new Date(job.joiningDate);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return joiningDate >= thirtyDaysAgo;
    });

    // Age distribution
    const ageGroups = state.employees.reduce((acc, emp) => {
      const age = new Date().getFullYear() - new Date(emp.dateOfBirth).getFullYear();
      const group = age < 25 ? '18-24' : age < 35 ? '25-34' : age < 45 ? '35-44' : age < 55 ? '45-54' : '55+';
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEmployees,
      totalCompanies,
      employeeTypes,
      genderDistribution,
      departmentDistribution,
      expiringDocs: expiringDocs.length,
      recentJoiners: recentJoiners.length,
      ageGroups
    };
  }, [state]);

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ElementType;
    color: string;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
  }> = ({ title, value, icon: Icon, color, change, trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${
            trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            <TrendingUp className={`w-4 h-4 ${trend === 'down' ? 'rotate-180' : ''}`} />
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        {change && <p className="text-xs text-gray-500">{change}</p>}
      </div>
    </div>
  );

  const ChartCard: React.FC<{
    title: string;
    data: Record<string, number>;
    type: 'pie' | 'bar';
  }> = ({ title, data, type }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        {type === 'pie' ? <PieChart className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
        {title}
      </h3>
      <div className="space-y-3">
        {Object.entries(data).map(([key, value], index) => {
          const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500'];
          const percentage = Object.values(data).reduce((a, b) => a + b, 0) > 0 
            ? Math.round((value / Object.values(data).reduce((a, b) => a + b, 0)) * 100) 
            : 0;
          
          return (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                <span className="text-sm text-gray-700">{key}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{value}</span>
                <span className="text-xs text-gray-500">({percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into your employee database</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Employees"
            value={analytics.totalEmployees}
            icon={Users}
            color="bg-blue-500"
            change={`+${analytics.recentJoiners} this month`}
            trend="up"
          />
          <StatCard
            title="Active Companies"
            value={analytics.totalCompanies}
            icon={Building}
            color="bg-emerald-500"
            change="Across all branches"
          />
          <StatCard
            title="Expiring Documents"
            value={analytics.expiringDocs}
            icon={AlertTriangle}
            color="bg-amber-500"
            change="Next 30 days"
            trend={analytics.expiringDocs > 0 ? 'up' : 'neutral'}
          />
          <StatCard
            title="New Joiners"
            value={analytics.recentJoiners}
            icon={Calendar}
            color="bg-purple-500"
            change="Last 30 days"
            trend="up"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartCard
            title="Employee Types"
            data={analytics.employeeTypes}
            type="pie"
          />
          <ChartCard
            title="Gender Distribution"
            data={analytics.genderDistribution}
            type="pie"
          />
          <ChartCard
            title="Department Distribution"
            data={analytics.departmentDistribution}
            type="bar"
          />
          <ChartCard
            title="Age Groups"
            data={analytics.ageGroups}
            type="bar"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Employees
            </h3>
            <div className="space-y-3">
              {state.employees.slice(-5).map(employee => {
                const company = state.companies.find(c => c.id === employee.companyId);
                const jobInfo = state.jobInfos.find(j => j.employeeId === employee.id);
                
                return (
                  <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{employee.fullName}</p>
                      <p className="text-sm text-gray-600">{jobInfo?.jobTitle || 'No position'}</p>
                      <p className="text-xs text-gray-500">{company?.name || 'No company'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{employee.id}</p>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        jobInfo?.employeeType === 'Permanent' ? 'bg-green-100 text-green-800' :
                        jobInfo?.employeeType === 'Contract' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {jobInfo?.employeeType || 'Unknown'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Document Alerts
            </h3>
            <div className="space-y-3">
              {state.documents.slice(0, 5).map(doc => {
                const employee = state.employees.find(e => e.id === doc.employeeId);
                const isPassportExpiring = doc.passportExpiryDate && 
                  new Date(doc.passportExpiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                const isIqamaExpiring = doc.iqamaExpiryDate && 
                  new Date(doc.iqamaExpiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                
                return (
                  <div key={doc.employeeId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{employee?.fullName || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{doc.employeeId}</p>
                    </div>
                    <div className="text-right">
                      {isPassportExpiring && (
                        <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">
                          Passport Expiring
                        </span>
                      )}
                      {isIqamaExpiring && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                          Iqama Expiring
                        </span>
                      )}
                      {!isPassportExpiring && !isIqamaExpiring && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          Valid
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};