import React, { useState } from 'react';
import { useEmployee } from '../context/EmployeeContext';
import { Plus, Edit, Award } from 'lucide-react';
import { SkillsExperience } from '../types/employee';

export const SkillsPage: React.FC = () => {
  const { state, dispatch } = useEmployee();
  const [showForm, setShowForm] = useState(false);
  const [editingSkills, setEditingSkills] = useState<SkillsExperience | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    skills: '',
    previousExperience: '',
    trainingCourses: '',
    remarks: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSkills) {
      dispatch({
        type: 'UPDATE_SKILLS_EXPERIENCE',
        payload: { ...formData }
      });
      setEditingSkills(null);
    } else {
      dispatch({
        type: 'ADD_SKILLS_EXPERIENCE',
        payload: { ...formData }
      });
    }
    
    setFormData({
      employeeId: '',
      skills: '',
      previousExperience: '',
      trainingCourses: '',
      remarks: ''
    });
    setShowForm(false);
  };

  const handleEdit = (skills: SkillsExperience) => {
    setEditingSkills(skills);
    setFormData({ ...skills });
    setShowForm(true);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Skills & Experience</h1>
            <p className="text-gray-600">Manage employee skills, certifications, and professional experience</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Skills & Experience
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {editingSkills ? 'Edit Skills & Experience' : 'Add Skills & Experience'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                    <select
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={!!editingSkills}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skills / Certifications</label>
                    <textarea
                      value={formData.skills}
                      onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="List skills and certifications separated by commas"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Previous Experience</label>
                    <textarea
                      value={formData.previousExperience}
                      onChange={(e) => setFormData({ ...formData, previousExperience: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Company Name, Years, Position (one per line)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Training Courses Attended</label>
                    <textarea
                      value={formData.trainingCourses}
                      onChange={(e) => setFormData({ ...formData, trainingCourses: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="List training courses and dates"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Additional notes or comments"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingSkills ? 'Update' : 'Add'} Skills & Experience
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingSkills(null);
                        setFormData({
                          employeeId: '',
                          skills: '',
                          previousExperience: '',
                          trainingCourses: '',
                          remarks: ''
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

        {/* Skills & Experience List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills & Experience Records</h2>
            
            {state.skillsExperiences.length > 0 ? (
              <div className="space-y-6">
                {state.skillsExperiences.map((skillExp) => {
                  const employee = state.employees.find(e => e.id === skillExp.employeeId);
                  
                  return (
                    <div key={skillExp.employeeId} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{employee?.fullName || 'Unknown Employee'}</h3>
                          <p className="text-sm text-gray-600">{skillExp.employeeId}</p>
                        </div>
                        <button
                          onClick={() => handleEdit(skillExp)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Skills & Certifications</h4>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-700 whitespace-pre-line">
                              {skillExp.skills || 'No skills listed'}
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Training Courses</h4>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-700 whitespace-pre-line">
                              {skillExp.trainingCourses || 'No training courses listed'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="md:col-span-2">
                          <h4 className="font-medium text-gray-900 mb-2">Previous Experience</h4>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-700 whitespace-pre-line">
                              {skillExp.previousExperience || 'No previous experience listed'}
                            </p>
                          </div>
                        </div>
                        
                        {skillExp.remarks && (
                          <div className="md:col-span-2">
                            <h4 className="font-medium text-gray-900 mb-2">Remarks</h4>
                            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                              <p className="text-sm text-gray-700 whitespace-pre-line">{skillExp.remarks}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No skills & experience records yet</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add First Skills Record
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};