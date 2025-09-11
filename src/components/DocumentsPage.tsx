import React, { useState } from 'react';
import { useEmployee } from '../context/EmployeeContext';
import { Plus, Edit, FileText, AlertTriangle } from 'lucide-react';
import { OfficialDocuments } from '../types/employee';

export const DocumentsPage: React.FC = () => {
  const { state, dispatch } = useEmployee();
  const [showForm, setShowForm] = useState(false);
  const [editingDocuments, setEditingDocuments] = useState<OfficialDocuments | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    passportNumber: '',
    passportExpiryDate: '',
    iqamaNumber: '',
    iqamaIssueDate: '',
    iqamaExpiryDate: '',
    visaNumber: '',
    insurancePolicyNumber: '',
    bankAccount: ''
  });

  const isExpiringSoon = (date: string) => {
    if (!date) return false;
    const expiryDate = new Date(date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingDocuments) {
      dispatch({
        type: 'UPDATE_DOCUMENTS',
        payload: { ...formData }
      });
      setEditingDocuments(null);
    } else {
      dispatch({
        type: 'ADD_DOCUMENTS',
        payload: { ...formData }
      });
    }
    
    setFormData({
      employeeId: '',
      passportNumber: '',
      passportExpiryDate: '',
      iqamaNumber: '',
      iqamaIssueDate: '',
      iqamaExpiryDate: '',
      visaNumber: '',
      insurancePolicyNumber: '',
      bankAccount: ''
    });
    setShowForm(false);
  };

  const handleEdit = (documents: OfficialDocuments) => {
    setEditingDocuments(documents);
    setFormData({ ...documents });
    setShowForm(true);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Official Documents</h1>
            <p className="text-gray-600">Manage employee documentation and identification</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Documents
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {editingDocuments ? 'Edit Documents' : 'Add Official Documents'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                    <select
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={!!editingDocuments}
                    >
                      <option value="">Select Employee</option>
                      {state.employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.fullName} ({employee.id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                      <input
                        type="text"
                        value={formData.passportNumber}
                        onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Passport Expiry Date</label>
                      <input
                        type="date"
                        value={formData.passportExpiryDate}
                        onChange={(e) => setFormData({ ...formData, passportExpiryDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Iqama / National ID</label>
                      <input
                        type="text"
                        value={formData.iqamaNumber}
                        onChange={(e) => setFormData({ ...formData, iqamaNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Iqama Issue Date</label>
                      <input
                        type="date"
                        value={formData.iqamaIssueDate}
                        onChange={(e) => setFormData({ ...formData, iqamaIssueDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Iqama Expiry Date</label>
                      <input
                        type="date"
                        value={formData.iqamaExpiryDate}
                        onChange={(e) => setFormData({ ...formData, iqamaExpiryDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Visa Number / Work Permit No.</label>
                      <input
                        type="text"
                        value={formData.visaNumber}
                        onChange={(e) => setFormData({ ...formData, visaNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Policy No.</label>
                      <input
                        type="text"
                        value={formData.insurancePolicyNumber}
                        onChange={(e) => setFormData({ ...formData, insurancePolicyNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account / IBAN</label>
                      <input
                        type="text"
                        value={formData.bankAccount}
                        onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingDocuments ? 'Update' : 'Add'} Documents
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingDocuments(null);
                        setFormData({
                          employeeId: '',
                          passportNumber: '',
                          passportExpiryDate: '',
                          iqamaNumber: '',
                          iqamaIssueDate: '',
                          iqamaExpiryDate: '',
                          visaNumber: '',
                          insurancePolicyNumber: '',
                          bankAccount: ''
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

        {/* Documents List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Records</h2>
            
            {state.documents.length > 0 ? (
              <div className="space-y-4">
                {state.documents.map((doc) => {
                  const employee = state.employees.find(e => e.id === doc.employeeId);
                  const passportExpiring = isExpiringSoon(doc.passportExpiryDate);
                  const iqamaExpiring = isExpiringSoon(doc.iqamaExpiryDate);
                  
                  return (
                    <div key={doc.employeeId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{employee?.fullName || 'Unknown Employee'}</h3>
                          <p className="text-sm text-gray-600">{doc.employeeId}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {(passportExpiring || iqamaExpiring) && (
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                          )}
                          <button
                            onClick={() => handleEdit(doc)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Passport:</p>
                          <p className="font-medium">{doc.passportNumber || 'N/A'}</p>
                          {doc.passportExpiryDate && (
                            <p className={`text-xs ${passportExpiring ? 'text-amber-600' : 'text-gray-500'}`}>
                              Expires: {doc.passportExpiryDate}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-500">Iqama:</p>
                          <p className="font-medium">{doc.iqamaNumber || 'N/A'}</p>
                          {doc.iqamaExpiryDate && (
                            <p className={`text-xs ${iqamaExpiring ? 'text-amber-600' : 'text-gray-500'}`}>
                              Expires: {doc.iqamaExpiryDate}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-500">Visa:</p>
                          <p className="font-medium">{doc.visaNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Insurance:</p>
                          <p className="font-medium">{doc.insurancePolicyNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Bank Account:</p>
                          <p className="font-medium">{doc.bankAccount || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No document records yet</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add First Document Record
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};