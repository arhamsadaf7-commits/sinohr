import React from 'react';
import { X, Download, User, Building, Calendar, MapPin, Phone, Mail, Award, Briefcase, FileText, AlertTriangle } from 'lucide-react';
import { EmployeeProfile } from '../../types/employee';

interface CVModalProps {
  employee: EmployeeProfile;
  onClose: () => void;
  onDownload: () => void;
}

export const CVModal: React.FC<CVModalProps> = ({ employee, onClose, onDownload }) => {
  const age = new Date().getFullYear() - new Date(employee.dateOfBirth).getFullYear();
  
  const isDocumentExpiring = (date: string) => {
    if (!date) return false;
    const expiryDate = new Date(date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiryDate <= thirtyDaysFromNow && expiryDate >= new Date();
  };

  const passportExpiring = employee.documents ? isDocumentExpiring(employee.documents.passportExpiryDate) : false;
  const iqamaExpiring = employee.documents ? isDocumentExpiring(employee.documents.iqamaExpiryDate) : false;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{employee.fullName}</h1>
              <p className="text-blue-100 text-lg">
                {employee.jobInfo?.jobTitle || 'Employee'} at {employee.company?.name || 'Company'}
              </p>
              <p className="text-blue-200 text-sm mt-1">Employee ID: {employee.id}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onDownload}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
                title="Download CV"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Personal Information
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Age:</span>
                  <span className="font-medium">{age} years old</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gender:</span>
                  <span className="font-medium">{employee.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nationality:</span>
                  <span className="font-medium">{employee.nationality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Marital Status:</span>
                  <span className="font-medium">{employee.maritalStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date of Birth:</span>
                  <span className="font-medium">{new Date(employee.dateOfBirth).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-600" />
                Contact Information
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{employee.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{employee.contactNumber}</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <span className="text-gray-900">{employee.address}</span>
                </div>
              </div>
            </div>

            {/* Employment Information */}
            {employee.jobInfo && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-purple-600" />
                  Employment Information
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Job Title:</span>
                    <span className="font-medium">{employee.jobInfo.jobTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Employee Type:</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      employee.jobInfo.employeeType === 'Permanent' ? 'bg-green-100 text-green-800' :
                      employee.jobInfo.employeeType === 'Contract' ? 'bg-blue-100 text-blue-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {employee.jobInfo.employeeType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Joining Date:</span>
                    <span className="font-medium">{new Date(employee.jobInfo.joiningDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Work Location:</span>
                    <span className="font-medium">{employee.jobInfo.workLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reporting Manager:</span>
                    <span className="font-medium">{employee.jobInfo.reportingManager}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Grade/Level:</span>
                    <span className="font-medium">{employee.jobInfo.grade}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Company Information */}
            {employee.company && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-600" />
                  Company Information
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Company:</span>
                    <span className="font-medium">{employee.company.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Branch/Division:</span>
                    <span className="font-medium">{employee.company.branch}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Department:</span>
                    <span className="font-medium">{employee.company.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Supervisor:</span>
                    <span className="font-medium">{employee.company.supervisor}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Skills & Experience */}
            {employee.skillsExperience && (
              <div className="lg:col-span-2 bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  Skills & Experience
                </h2>
                
                {employee.skillsExperience.skills && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Skills & Certifications</h3>
                    <div className="flex flex-wrap gap-2">
                      {employee.skillsExperience.skills.split(',').map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {employee.skillsExperience.previousExperience && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Previous Experience</h3>
                    <div className="bg-white p-4 rounded-lg border">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                        {employee.skillsExperience.previousExperience}
                      </pre>
                    </div>
                  </div>
                )}

                {employee.skillsExperience.trainingCourses && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Training Courses</h3>
                    <div className="bg-white p-4 rounded-lg border">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                        {employee.skillsExperience.trainingCourses}
                      </pre>
                    </div>
                  </div>
                )}

                {employee.skillsExperience.remarks && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Remarks</h3>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                        {employee.skillsExperience.remarks}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Official Documents */}
            {employee.documents && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-red-600" />
                  Official Documents
                  {(passportExpiring || iqamaExpiring) && (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  )}
                </h2>
                <div className="space-y-3">
                  {employee.documents.passportNumber && (
                    <div className={`p-3 rounded-lg border ${passportExpiring ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Passport:</span>
                        <span className="font-medium">{employee.documents.passportNumber}</span>
                      </div>
                      {employee.documents.passportExpiryDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Expires: {new Date(employee.documents.passportExpiryDate).toLocaleDateString()}
                          {passportExpiring && <span className="text-amber-600 ml-2">⚠️ Expiring Soon</span>}
                        </div>
                      )}
                    </div>
                  )}

                  {employee.documents.iqamaNumber && (
                    <div className={`p-3 rounded-lg border ${iqamaExpiring ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Iqama:</span>
                        <span className="font-medium">{employee.documents.iqamaNumber}</span>
                      </div>
                      {employee.documents.iqamaExpiryDate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Expires: {new Date(employee.documents.iqamaExpiryDate).toLocaleDateString()}
                          {iqamaExpiring && <span className="text-amber-600 ml-2">⚠️ Expiring Soon</span>}
                        </div>
                      )}
                    </div>
                  )}

                  {employee.documents.visaNumber && (
                    <div className="flex justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-600">Visa Number:</span>
                      <span className="font-medium">{employee.documents.visaNumber}</span>
                    </div>
                  )}

                  {employee.documents.insurancePolicyNumber && (
                    <div className="flex justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-600">Insurance Policy:</span>
                      <span className="font-medium">{employee.documents.insurancePolicyNumber}</span>
                    </div>
                  )}

                  {employee.documents.bankAccount && (
                    <div className="flex justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-600">Bank Account:</span>
                      <span className="font-medium">{employee.documents.bankAccount}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            {employee.emergencyContact && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-600" />
                  Emergency Contact
                </h2>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{employee.emergencyContact.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Relation:</span>
                      <span className="font-medium">{employee.emergencyContact.relation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium">{employee.emergencyContact.contactNumber}</span>
                    </div>
                    <div className="mt-3">
                      <span className="text-gray-600 block mb-1">Address:</span>
                      <span className="text-sm text-gray-700">{employee.emergencyContact.address}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Data Completeness Indicator */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-3">Profile Completeness</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${employee.jobInfo ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm text-gray-700">Job Info</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${employee.documents ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm text-gray-700">Documents</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${employee.emergencyContact ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm text-gray-700">Emergency Contact</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${employee.skillsExperience ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="text-sm text-gray-700">Skills & Experience</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download CV
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};