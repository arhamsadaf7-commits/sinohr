import React, { useState, useMemo } from 'react';
import { useEmployee } from '../../context/EmployeeContext';
import { Search, Filter, Download, Eye, User, Building, Calendar, MapPin, Phone, Mail, Award, Briefcase, FileText, Users } from 'lucide-react';
import { EmployeeProfile } from '../../types/employee';
import { CVModal } from './CVModal';

export const EmployeeSearchPage: React.FC = () => {
  const { state } = useEmployee();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeProfile | null>(null);
  const [showCVModal, setShowCVModal] = useState(false);
  const [filters, setFilters] = useState({
    company: '',
    department: '',
    jobTitle: '',
    employeeType: '',
    nationality: '',
    gender: '',
    maritalStatus: '',
    hasDocuments: '',
    hasEmergencyContact: '',
    hasSkills: '',
    joiningDateFrom: '',
    joiningDateTo: '',
    ageFrom: '',
    ageTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Create complete employee profiles with all related data
  const employeeProfiles: EmployeeProfile[] = useMemo(() => {
    return state.employees.map(employee => {
      const company = state.companies.find(c => c.id === employee.companyId);
      const jobInfo = state.jobInfos.find(j => j.employeeId === employee.id);
      const documents = state.documents.find(d => d.employeeId === employee.id);
      const emergencyContact = state.emergencyContacts.find(ec => ec.employeeId === employee.id);
      const skillsExperience = state.skillsExperiences.find(se => se.employeeId === employee.id);

      return {
        ...employee,
        company,
        jobInfo,
        documents,
        emergencyContact,
        skillsExperience
      };
    });
  }, [state]);

  // Filter and search employees
  const filteredEmployees = useMemo(() => {
    return employeeProfiles.filter(employee => {
      // Text search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        employee.fullName.toLowerCase().includes(searchLower) ||
        employee.email.toLowerCase().includes(searchLower) ||
        employee.id.toLowerCase().includes(searchLower) ||
        employee.contactNumber.includes(searchTerm) ||
        (employee.company?.name || '').toLowerCase().includes(searchLower) ||
        (employee.jobInfo?.jobTitle || '').toLowerCase().includes(searchLower) ||
        employee.nationality.toLowerCase().includes(searchLower);

      // Filters
      const matchesCompany = !filters.company || employee.companyId === filters.company;
      const matchesDepartment = !filters.department || employee.company?.department === filters.department;
      const matchesJobTitle = !filters.jobTitle || (employee.jobInfo?.jobTitle || '').toLowerCase().includes(filters.jobTitle.toLowerCase());
      const matchesEmployeeType = !filters.employeeType || employee.jobInfo?.employeeType === filters.employeeType;
      const matchesNationality = !filters.nationality || employee.nationality.toLowerCase().includes(filters.nationality.toLowerCase());
      const matchesGender = !filters.gender || employee.gender === filters.gender;
      const matchesMaritalStatus = !filters.maritalStatus || employee.maritalStatus === filters.maritalStatus;
      
      // Data completeness filters
      const matchesDocuments = !filters.hasDocuments || 
        (filters.hasDocuments === 'yes' && employee.documents) ||
        (filters.hasDocuments === 'no' && !employee.documents);
      const matchesEmergencyContact = !filters.hasEmergencyContact || 
        (filters.hasEmergencyContact === 'yes' && employee.emergencyContact) ||
        (filters.hasEmergencyContact === 'no' && !employee.emergencyContact);
      const matchesSkills = !filters.hasSkills || 
        (filters.hasSkills === 'yes' && employee.skillsExperience) ||
        (filters.hasSkills === 'no' && !employee.skillsExperience);

      // Date filters
      const joiningDate = employee.jobInfo?.joiningDate ? new Date(employee.jobInfo.joiningDate) : null;
      const matchesJoiningFrom = !filters.joiningDateFrom || !joiningDate || joiningDate >= new Date(filters.joiningDateFrom);
      const matchesJoiningTo = !filters.joiningDateTo || !joiningDate || joiningDate <= new Date(filters.joiningDateTo);

      // Age filters
      const age = new Date().getFullYear() - new Date(employee.dateOfBirth).getFullYear();
      const matchesAgeFrom = !filters.ageFrom || age >= parseInt(filters.ageFrom);
      const matchesAgeTo = !filters.ageTo || age <= parseInt(filters.ageTo);

      return matchesSearch && matchesCompany && matchesDepartment && matchesJobTitle && 
             matchesEmployeeType && matchesNationality && matchesGender && matchesMaritalStatus &&
             matchesDocuments && matchesEmergencyContact && matchesSkills &&
             matchesJoiningFrom && matchesJoiningTo && matchesAgeFrom && matchesAgeTo;
    });
  }, [employeeProfiles, searchTerm, filters]);

  const handleViewCV = (employee: EmployeeProfile) => {
    setSelectedEmployee(employee);
    setShowCVModal(true);
  };

  const handleDownloadCV = (employee: EmployeeProfile) => {
    // Generate CV content
    const cvContent = generateCVContent(employee);
    
    // Create and download file
    const blob = new Blob([cvContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${employee.fullName.replace(/\s+/g, '_')}_CV.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateCVContent = (employee: EmployeeProfile): string => {
    const age = new Date().getFullYear() - new Date(employee.dateOfBirth).getFullYear();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${employee.fullName} - CV</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f5f5f5; }
        .cv-container { max-width: 800px; margin: 0 auto; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 1.2em; }
        .content { padding: 40px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; margin-bottom: 20px; }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .info-item { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; }
        .info-item strong { color: #333; display: block; margin-bottom: 5px; }
        .skills-list { display: flex; flex-wrap: wrap; gap: 10px; }
        .skill-tag { background: #667eea; color: white; padding: 5px 12px; border-radius: 20px; font-size: 0.9em; }
        .experience-item { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #764ba2; }
        @media print { body { background: white; } .cv-container { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="cv-container">
        <div class="header">
            <h1>${employee.fullName}</h1>
            <p>${employee.jobInfo?.jobTitle || 'Employee'} at ${employee.company?.name || 'Company'}</p>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>Personal Information</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Employee ID</strong>
                        ${employee.id}
                    </div>
                    <div class="info-item">
                        <strong>Age</strong>
                        ${age} years old
                    </div>
                    <div class="info-item">
                        <strong>Gender</strong>
                        ${employee.gender}
                    </div>
                    <div class="info-item">
                        <strong>Nationality</strong>
                        ${employee.nationality}
                    </div>
                    <div class="info-item">
                        <strong>Marital Status</strong>
                        ${employee.maritalStatus}
                    </div>
                    <div class="info-item">
                        <strong>Date of Birth</strong>
                        ${new Date(employee.dateOfBirth).toLocaleDateString()}
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Contact Information</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Email</strong>
                        ${employee.email}
                    </div>
                    <div class="info-item">
                        <strong>Phone</strong>
                        ${employee.contactNumber}
                    </div>
                    <div class="info-item">
                        <strong>Address</strong>
                        ${employee.address}
                    </div>
                </div>
            </div>

            ${employee.jobInfo ? `
            <div class="section">
                <h2>Employment Information</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Job Title</strong>
                        ${employee.jobInfo.jobTitle}
                    </div>
                    <div class="info-item">
                        <strong>Employee Type</strong>
                        ${employee.jobInfo.employeeType}
                    </div>
                    <div class="info-item">
                        <strong>Joining Date</strong>
                        ${new Date(employee.jobInfo.joiningDate).toLocaleDateString()}
                    </div>
                    <div class="info-item">
                        <strong>Work Location</strong>
                        ${employee.jobInfo.workLocation}
                    </div>
                    <div class="info-item">
                        <strong>Reporting Manager</strong>
                        ${employee.jobInfo.reportingManager}
                    </div>
                    <div class="info-item">
                        <strong>Grade/Level</strong>
                        ${employee.jobInfo.grade}
                    </div>
                </div>
            </div>
            ` : ''}

            ${employee.company ? `
            <div class="section">
                <h2>Company Information</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Company</strong>
                        ${employee.company.name}
                    </div>
                    <div class="info-item">
                        <strong>Branch/Division</strong>
                        ${employee.company.branch}
                    </div>
                    <div class="info-item">
                        <strong>Department</strong>
                        ${employee.company.department}
                    </div>
                    <div class="info-item">
                        <strong>Supervisor</strong>
                        ${employee.company.supervisor}
                    </div>
                </div>
            </div>
            ` : ''}

            ${employee.skillsExperience ? `
            <div class="section">
                <h2>Skills & Experience</h2>
                ${employee.skillsExperience.skills ? `
                <div style="margin-bottom: 20px;">
                    <strong style="display: block; margin-bottom: 10px;">Skills & Certifications</strong>
                    <div class="skills-list">
                        ${employee.skillsExperience.skills.split(',').map(skill => 
                          `<span class="skill-tag">${skill.trim()}</span>`
                        ).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${employee.skillsExperience.previousExperience ? `
                <div style="margin-bottom: 20px;">
                    <strong style="display: block; margin-bottom: 10px;">Previous Experience</strong>
                    <div class="experience-item">
                        <pre style="white-space: pre-wrap; margin: 0; font-family: inherit;">${employee.skillsExperience.previousExperience}</pre>
                    </div>
                </div>
                ` : ''}

                ${employee.skillsExperience.trainingCourses ? `
                <div style="margin-bottom: 20px;">
                    <strong style="display: block; margin-bottom: 10px;">Training Courses</strong>
                    <div class="experience-item">
                        <pre style="white-space: pre-wrap; margin: 0; font-family: inherit;">${employee.skillsExperience.trainingCourses}</pre>
                    </div>
                </div>
                ` : ''}
            </div>
            ` : ''}

            ${employee.emergencyContact ? `
            <div class="section">
                <h2>Emergency Contact</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Name</strong>
                        ${employee.emergencyContact.name}
                    </div>
                    <div class="info-item">
                        <strong>Relation</strong>
                        ${employee.emergencyContact.relation}
                    </div>
                    <div class="info-item">
                        <strong>Contact Number</strong>
                        ${employee.emergencyContact.contactNumber}
                    </div>
                    <div class="info-item">
                        <strong>Address</strong>
                        ${employee.emergencyContact.address}
                    </div>
                </div>
            </div>
            ` : ''}

            ${employee.documents ? `
            <div class="section">
                <h2>Official Documents</h2>
                <div class="info-grid">
                    ${employee.documents.passportNumber ? `
                    <div class="info-item">
                        <strong>Passport Number</strong>
                        ${employee.documents.passportNumber}
                        ${employee.documents.passportExpiryDate ? `<br><small>Expires: ${new Date(employee.documents.passportExpiryDate).toLocaleDateString()}</small>` : ''}
                    </div>
                    ` : ''}
                    ${employee.documents.iqamaNumber ? `
                    <div class="info-item">
                        <strong>Iqama Number</strong>
                        ${employee.documents.iqamaNumber}
                        ${employee.documents.iqamaExpiryDate ? `<br><small>Expires: ${new Date(employee.documents.iqamaExpiryDate).toLocaleDateString()}</small>` : ''}
                    </div>
                    ` : ''}
                    ${employee.documents.visaNumber ? `
                    <div class="info-item">
                        <strong>Visa Number</strong>
                        ${employee.documents.visaNumber}
                    </div>
                    ` : ''}
                    ${employee.documents.insurancePolicyNumber ? `
                    <div class="info-item">
                        <strong>Insurance Policy</strong>
                        ${employee.documents.insurancePolicyNumber}
                    </div>
                    ` : ''}
                    ${employee.documents.bankAccount ? `
                    <div class="info-item">
                        <strong>Bank Account</strong>
                        ${employee.documents.bankAccount}
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}
        </div>
    </div>
</body>
</html>`;
  };

  const clearFilters = () => {
    setFilters({
      company: '',
      department: '',
      jobTitle: '',
      employeeType: '',
      nationality: '',
      gender: '',
      maritalStatus: '',
      hasDocuments: '',
      hasEmergencyContact: '',
      hasSkills: '',
      joiningDateFrom: '',
      joiningDateTo: '',
      ageFrom: '',
      ageTo: ''
    });
  };

  const exportAllCVs = () => {
    filteredEmployees.forEach(employee => {
      setTimeout(() => handleDownloadCV(employee), 100);
    });
  };

  // Get unique values for filter dropdowns
  const uniqueCompanies = [...new Set(state.companies.map(c => c.name))];
  const uniqueDepartments = [...new Set(state.companies.map(c => c.department))];
  const uniqueJobTitles = [...new Set(state.jobInfos.map(j => j.jobTitle))];
  const uniqueNationalities = [...new Set(state.employees.map(e => e.nationality))];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Search & CV Generator</h1>
            <p className="text-gray-600">Search employees and generate professional CV documents</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button
              onClick={exportAllCVs}
              disabled={filteredEmployees.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Download All CVs ({filteredEmployees.length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, employee ID, company, job title, or nationality..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Advanced Filters</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear All Filters
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <select
                  value={filters.company}
                  onChange={(e) => setFilters({ ...filters, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Companies</option>
                  {state.companies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Departments</option>
                  {uniqueDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input
                  type="text"
                  value={filters.jobTitle}
                  onChange={(e) => setFilters({ ...filters, jobTitle: e.target.value })}
                  placeholder="Search job titles..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Type</label>
                <select
                  value={filters.employeeType}
                  onChange={(e) => setFilters({ ...filters, employeeType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="Permanent">Permanent</option>
                  <option value="Contract">Contract</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <input
                  type="text"
                  value={filters.nationality}
                  onChange={(e) => setFilters({ ...filters, nationality: e.target.value })}
                  placeholder="Search nationality..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                <select
                  value={filters.maritalStatus}
                  onChange={(e) => setFilters({ ...filters, maritalStatus: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Has Documents</label>
                <select
                  value={filters.hasDocuments}
                  onChange={(e) => setFilters({ ...filters, hasDocuments: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Has Emergency Contact</label>
                <select
                  value={filters.hasEmergencyContact}
                  onChange={(e) => setFilters({ ...filters, hasEmergencyContact: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Has Skills Data</label>
                <select
                  value={filters.hasSkills}
                  onChange={(e) => setFilters({ ...filters, hasSkills: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date From</label>
                <input
                  type="date"
                  value={filters.joiningDateFrom}
                  onChange={(e) => setFilters({ ...filters, joiningDateFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date To</label>
                <input
                  type="date"
                  value={filters.joiningDateTo}
                  onChange={(e) => setFilters({ ...filters, joiningDateTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age From</label>
                <input
                  type="number"
                  value={filters.ageFrom}
                  onChange={(e) => setFilters({ ...filters, ageFrom: e.target.value })}
                  placeholder="Min age"
                  min="18"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age To</label>
                <input
                  type="number"
                  value={filters.ageTo}
                  onChange={(e) => setFilters({ ...filters, ageTo: e.target.value })}
                  placeholder="Max age"
                  min="18"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">
                  {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} found
                </span>
              </div>
              {searchTerm && (
                <div className="text-sm text-gray-600">
                  Searching for: <span className="font-medium">"{searchTerm}"</span>
                </div>
              )}
            </div>
            {filteredEmployees.length > 0 && (
              <div className="text-sm text-gray-500">
                Click "View CV" to see detailed profile or "Download" for CV file
              </div>
            )}
          </div>
        </div>

        {/* Employee Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6">
            {filteredEmployees.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredEmployees.map((employee) => {
                  const age = new Date().getFullYear() - new Date(employee.dateOfBirth).getFullYear();
                  const completionScore = [
                    employee.jobInfo,
                    employee.documents,
                    employee.emergencyContact,
                    employee.skillsExperience
                  ].filter(Boolean).length;

                  return (
                    <div key={employee.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{employee.fullName}</h3>
                          <p className="text-sm text-gray-600 mb-1">{employee.id}</p>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              employee.jobInfo?.employeeType === 'Permanent' ? 'bg-green-100 text-green-800' :
                              employee.jobInfo?.employeeType === 'Contract' ? 'bg-blue-100 text-blue-800' :
                              employee.jobInfo?.employeeType === 'Intern' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {employee.jobInfo?.employeeType || 'No Type'}
                            </span>
                            <span className="text-xs text-gray-500">
                              Profile {Math.round((completionScore / 4) * 100)}% complete
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewCV(employee)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View CV"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadCV(employee)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Download CV"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{employee.company?.name || 'No Company'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{employee.jobInfo?.jobTitle || 'No Position'}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{employee.email}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{employee.contactNumber}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{employee.gender}, {age} years, {employee.nationality}</span>
                        </div>

                        {employee.jobInfo?.joiningDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">
                              Joined {new Date(employee.jobInfo.joiningDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        {employee.jobInfo?.workLocation && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">{employee.jobInfo.workLocation}</span>
                          </div>
                        )}

                        {/* Data Indicators */}
                        <div className="flex gap-2 pt-2">
                          {employee.documents && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              <FileText className="w-3 h-3 inline mr-1" />
                              Docs
                            </span>
                          )}
                          {employee.emergencyContact && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              <Phone className="w-3 h-3 inline mr-1" />
                              Emergency
                            </span>
                          )}
                          {employee.skillsExperience && (
                            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                              <Award className="w-3 h-3 inline mr-1" />
                              Skills
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || Object.values(filters).some(f => f) 
                    ? 'Try adjusting your search terms or filters'
                    : 'No employees have been added to the database yet'
                  }
                </p>
                {(searchTerm || Object.values(filters).some(f => f)) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      clearFilters();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear Search & Filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* CV Modal */}
        {showCVModal && selectedEmployee && (
          <CVModal
            employee={selectedEmployee}
            onClose={() => {
              setShowCVModal(false);
              setSelectedEmployee(null);
            }}
            onDownload={() => handleDownloadCV(selectedEmployee)}
          />
        )}
      </div>
    </div>
  );
};