import React, { useState } from 'react';
import { useEmployee } from '../context/EmployeeContext';
import { Plus, Edit, Briefcase } from 'lucide-react';
import { JobInfo } from '../types/employee';

export const JobInfoPage: React.FC = () => {
  const { state, dispatch } = useEmployee();
  const [showForm, setShowForm] = useState(false);
  const [editingJobInfo, setEditingJobInfo] = useState<JobInfo | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    jobTitle: '',
    employeeType: 'Permanent' as 'Permanent' | 'Contract' | 'Intern',
    joiningDate: '',
    workLocation: '',
    reportingManager: '',
    grade: '',
    salary: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingJobInfo) {
      dispatch({
        type: 'UPDATE_JOB_INFO',
        payload: { ...formData }
      });
      setEditingJobInfo(null);
    } else {
      dispatch({
        type: 'ADD_JOB_INFO',
        payload: { ...formData }
      });
    }
    
    setFormData({
      employeeId: '',
      jobTitle: '',
      employeeType: 'Permanent',
      joiningDate: '',
      workLocation: '',
      reportingManager: '',
      grade: '',
      salary: ''
    });
    setShowForm(false);
  };

  const handleEdit = (jobInfo: JobInfo) => {
    setEditingJobInfo(jobInfo);
    setFormData({ ...jobInfo });
    setShowForm(true);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Information</h1>
            <p className="text-gray-600">Manage employee job details and organizational hierarchy</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Job Info
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {editingJobInfo ? 'Edit Job Information' : 'Add Job Information'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                      <select
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        disabled={!!editingJobInfo}
                      >
                        <option value="">Select Employee</option>
                        {state.employees.map(employee => (
                          <option key={employee.id} value={employee.id}>
                            {employee.fullName} ({employee.id})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Title/Position</label>
                      <input
                        type="text"
                        value={formData.jobTitle}
                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee Type</label>
                      <select
                        value={formData.employeeType}
                        onChange={(e) => setFormData({ ...formData, employeeType: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Permanent">Permanent</option>
                        <option value="Contract">Contract</option>
                        <option value="Intern">Intern</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                      <input
                        type="date"
                        value={formData.joiningDate}
                        onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Manager</label>
                      <input
                        type="text"
                        value={formData.reportingManager}
                        onChange={(e) => setFormData({ ...formData, reportingManager: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Grade/Level</label>
                      <input
                        type="text"
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salary/Package</label>
                      <input
                        type="text"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingJobInfo ? 'Update' : 'Add'} Job Information
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingJobInfo(null);
                        setFormData({
                          employeeId: '',
                          jobTitle: '',
                          employeeType: 'Permanent',
                          joiningDate: '',
                          workLocation: '',
                          reportingManager: '',
                          grade: '',
                          salary: ''
                        });
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

        {/* Job Information List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Information Records</h2>
            
            {state.jobInfos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Employee</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Job Title</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Joining Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Manager</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Grade</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.jobInfos.map((jobInfo) => {
                      const employee = state.employees.find(e => e.id === jobInfo.employeeId);
                      
                      return (
                        <tr key={jobInfo.employeeId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{employee?.fullName || 'Unknown'}</p>
                              <p className="text-sm text-gray-600">{jobInfo.employeeId}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">{jobInfo.jobTitle}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              jobInfo.employeeType === 'Permanent' ? 'bg-green-100 text-green-800' :
                              jobInfo.employeeType === 'Contract' ? 'bg-blue-100 text-blue-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {jobInfo.employeeType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{jobInfo.joiningDate}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{jobInfo.reportingManager}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{jobInfo.grade}</td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleEdit(jobInfo)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No job information records yet</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add First Job Record
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};