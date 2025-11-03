import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Filter, Users, Download, Plus, RefreshCw,
  Briefcase, Calendar, MapPin, Mail, Phone, Eye,
  ChevronLeft, ChevronRight, Save, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchEmployees,
  fetchDepartments,
  fetchDesignations,
  exportEmployeesToCSV
} from '../../services/employeeService';
import type {
  EmployeeNew,
  EmployeeFilters,
  EmployeeSortOptions,
  Department,
  Designation
} from '../../types/employee';

export const EmployeeDirectory: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeNew[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [filters, setFilters] = useState<EmployeeFilters>({
    search: '',
    is_active: true
  });
  const [showFilters, setShowFilters] = useState(false);

  // Sort
  const [sortOptions, setSortOptions] = useState<EmployeeSortOptions>({
    field: 'full_name_en',
    direction: 'asc'
  });

  // Selected employees for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [filters, sortOptions, currentPage, pageSize]);

  const loadInitialData = async () => {
    try {
      const [depts, desigs] = await Promise.all([
        fetchDepartments(),
        fetchDesignations()
      ]);
      setDepartments(depts);
      setDesignations(desigs);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load filters data');
    }
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const result = await fetchEmployees(filters, sortOptions, currentPage, pageSize);
      setEmployees(result.employees);
      setTotalCount(result.total);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setCurrentPage(1);
  };

  const handleFilterChange = (key: keyof EmployeeFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', is_active: true });
    setCurrentPage(1);
  };

  const handleSort = (field: EmployeeSortOptions['field']) => {
    setSortOptions(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === employees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(employees.map(emp => emp.employee_id));
    }
  };

  const toggleSelectEmployee = (employeeId: string) => {
    setSelectedIds(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const csv = await exportEmployeesToCSV(filters);

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Employees exported successfully');
    } catch (error) {
      console.error('Error exporting employees:', error);
      toast.error('Failed to export employees');
    } finally {
      setExporting(false);
    }
  };

  const filteredDesignations = useMemo(() => {
    if (!filters.department_id) return designations;
    return designations.filter(d => d.department_id === filters.department_id);
  }, [designations, filters.department_id]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.department_id) count++;
    if (filters.designation_id) count++;
    if (filters.employment_status) count++;
    if (filters.employment_type) count++;
    if (filters.joining_date_from) count++;
    if (filters.joining_date_to) count++;
    return count;
  }, [filters]);

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Directory</h1>
              <p className="text-gray-600">
                {totalCount} employee{totalCount !== 1 ? 's' : ''} found
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={loadEmployees}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <button
                onClick={handleExportCSV}
                disabled={exporting || employees.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Exporting...' : 'Export CSV'}
              </button>

              <button
                onClick={() => window.location.href = '/employees/new'}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Employee
              </button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or employee code..."
                    value={filters.search || ''}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg transition-colors ${
                  showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Department Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <select
                      value={filters.department_id || ''}
                      onChange={(e) => handleFilterChange('department_id', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept.department_id} value={dept.department_id}>
                          {dept.name_en}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Designation Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Designation
                    </label>
                    <select
                      value={filters.designation_id || ''}
                      onChange={(e) => handleFilterChange('designation_id', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Designations</option>
                      {filteredDesignations.map(desig => (
                        <option key={desig.designation_id} value={desig.designation_id}>
                          {desig.title_en}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Employment Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employment Status
                    </label>
                    <select
                      value={filters.employment_status || ''}
                      onChange={(e) => handleFilterChange('employment_status', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="on-leave">On Leave</option>
                      <option value="terminated">Terminated</option>
                      <option value="resigned">Resigned</option>
                    </select>
                  </div>

                  {/* Employment Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employment Type
                    </label>
                    <select
                      value={filters.employment_type || ''}
                      onChange={(e) => handleFilterChange('employment_type', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Types</option>
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="intern">Intern</option>
                      <option value="consultant">Consultant</option>
                    </select>
                  </div>

                  {/* Joining Date From */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Joining Date From
                    </label>
                    <input
                      type="date"
                      value={filters.joining_date_from || ''}
                      onChange={(e) => handleFilterChange('joining_date_from', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Joining Date To */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Joining Date To
                    </label>
                    <input
                      type="date"
                      value={filters.joining_date_to || ''}
                      onChange={(e) => handleFilterChange('joining_date_to', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedIds.length} employee{selectedIds.length !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-4 py-2 text-sm text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Employee Cards - Grid View */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">No employees found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map(employee => (
                <div
                  key={employee.employee_id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(employee.employee_id)}
                        onChange={() => toggleSelectEmployee(employee.employee_id)}
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />

                      {/* Avatar */}
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                        {employee.first_name_en?.[0]}{employee.last_name_en?.[0]}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {employee.full_name_en}
                        </h3>
                        <p className="text-sm text-gray-600">{employee.employee_code}</p>

                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            employee.employment_status === 'active' ? 'bg-green-100 text-green-800' :
                            employee.employment_status === 'on-leave' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {employee.employment_status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="mt-4 space-y-2">
                      {employee.designation && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Briefcase className="w-4 h-4" />
                          <span className="truncate">{employee.designation.title_en}</span>
                        </div>
                      )}

                      {employee.department && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span className="truncate">{employee.department.name_en}</span>
                        </div>
                      )}

                      {employee.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{employee.email}</span>
                        </div>
                      )}

                      {employee.phone_primary && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <span>{employee.phone_primary}</span>
                        </div>
                      )}

                      {employee.joining_date && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Joined {new Date(employee.joining_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <button
                      onClick={() => window.location.href = `/employees/${employee.employee_id}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Show</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span>per page</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
                        {currentPage} / {totalPages}
                      </span>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
