export interface Company {
  id: string;
  name: string;
  branch: string;
  department: string;
  workLocation: string;
  supervisor: string;
}

export interface Employee {
  id: string;
  companyId: string;
  fullName: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  nationality: string;
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  contactNumber: string;
  email: string;
  address: string;
}

export interface JobInfo {
  employeeId: string;
  jobTitle: string;
  employeeType: 'Permanent' | 'Contract' | 'Intern';
  joiningDate: string;
  workLocation: string;
  reportingManager: string;
  grade: string;
  salary: string;
}

export interface OfficialDocuments {
  employeeId: string;
  passportNumber: string;
  passportExpiryDate: string;
  iqamaNumber: string;
  iqamaIssueDate: string;
  iqamaExpiryDate: string;
  visaNumber: string;
  insurancePolicyNumber: string;
  bankAccount: string;
}

export interface EmergencyContact {
  employeeId: string;
  name: string;
  relation: string;
  contactNumber: string;
  address: string;
}

export interface SkillsExperience {
  employeeId: string;
  skills: string;
  previousExperience: string;
  trainingCourses: string;
  remarks: string;
}

export interface EmployeeProfile extends Employee {
  company?: Company;
  jobInfo?: JobInfo;
  documents?: OfficialDocuments;
  emergencyContact?: EmergencyContact;
  skillsExperience?: SkillsExperience;
}