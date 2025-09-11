import React, { useState } from 'react';
import { useEmployee } from '../context/EmployeeContext';
import { Plus, Edit, Phone } from 'lucide-react';
import { EmergencyContact } from '../types/employee';

export const EmergencyContactPage: React.FC = () => {
  const { state, dispatch } = useEmployee();
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    relation: '',
    contactNumber: '',
    address: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingContact) {
      dispatch({
        type: 'UPDATE_EMERGENCY_CONTACT',
        payload: { ...formData }
      });
      setEditingContact(null);
    } else {
      dispatch({
        type: 'ADD_EMERGENCY_CONTACT',
        payload: { ...formData }
      });
    }
    
    setFormData({
      employeeId: '',
      name: '',
      relation: '',
      contactNumber: '',
      address: ''
    });
    setShowForm(false);
  };

  const handleEdit = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormData({ ...contact });
    setShowForm(true);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency Contacts</h1>
            <p className="text-gray-600">Manage employee emergency contact information</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Emergency Contact
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                    <select
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={!!editingContact}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                    <input
                      type="text"
                      value={formData.relation}
                      onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Spouse, Parent, Sibling"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input
                      type="tel"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingContact ? 'Update' : 'Add'} Contact
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingContact(null);
                        setFormData({
                          employeeId: '',
                          name: '',
                          relation: '',
                          contactNumber: '',
                          address: ''
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

        {/* Emergency Contacts List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact Records</h2>
            
            {state.emergencyContacts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.emergencyContacts.map((contact) => {
                  const employee = state.employees.find(e => e.id === contact.employeeId);
                  
                  return (
                    <div key={contact.employeeId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{employee?.fullName || 'Unknown Employee'}</h3>
                          <p className="text-sm text-gray-600">{contact.employeeId}</p>
                        </div>
                        <button
                          onClick={() => handleEdit(contact)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium text-gray-900">{contact.name}</p>
                          <p className="text-gray-600">{contact.relation}</p>
                          <p className="text-gray-600">{contact.contactNumber}</p>
                          <p className="text-gray-500 text-xs mt-1">{contact.address}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No emergency contacts added yet</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add First Emergency Contact
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};