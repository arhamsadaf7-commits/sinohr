import React, { useState } from 'react';
import { useEmployee } from '../context/EmployeeContext';
import { Plus, Edit, Trash2, Building } from 'lucide-react';
import { Company } from '../types/employee';

export const CompanyPage: React.FC = () => {
  const { state, dispatch } = useEmployee();
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    branch: '',
    department: '',
    workLocation: '',
    supervisor: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCompany) {
      dispatch({
        type: 'UPDATE_COMPANY',
        payload: { ...editingCompany, ...formData }
      });
      setEditingCompany(null);
    } else {
      dispatch({
        type: 'ADD_COMPANY',
        payload: {
          id: Date.now().toString(),
          ...formData
        }
      });
    }
    
    setFormData({ name: '', branch: '', department: '', workLocation: '', supervisor: '' });
    setShowForm(false);
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      branch: company.branch,
      department: company.department,
      workLocation: company.workLocation,
      supervisor: company.supervisor
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this company?')) {
      dispatch({ type: 'DELETE_COMPANY', payload: id });
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Information</h1>
            <p className="text-gray-600">Manage company details and organizational structure</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Company
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {editingCompany ? 'Edit Company' : 'Add New Company'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch/Division</label>
                    <input
                      type="text"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Location</label>
                    <input
                      type="text"
                      value={formData.workLocation}
                      onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor/Manager</label>
                    <input
                      type="text"
                      value={formData.supervisor}
                      onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingCompany ? 'Update' : 'Add'} Company
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingCompany(null);
                        setFormData({ name: '', branch: '', department: '', workLocation: '', supervisor: '' });
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Companies List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Registered Companies</h2>
            
            {state.companies.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Company ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Company Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Branch/Division</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Department</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Work Location</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Supervisor</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.companies.map((company) => (
                      <tr key={company.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">{company.id}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{company.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{company.branch}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{company.department}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{company.workLocation}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{company.supervisor}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(company)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(company.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No companies registered yet</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add First Company
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};