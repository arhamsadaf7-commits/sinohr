import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Company, Employee, JobInfo, OfficialDocuments, EmergencyContact, SkillsExperience } from '../types/employee';

interface EmployeeState {
  companies: Company[];
  employees: Employee[];
  jobInfos: JobInfo[];
  documents: OfficialDocuments[];
  emergencyContacts: EmergencyContact[];
  skillsExperiences: SkillsExperience[];
}

type EmployeeAction =
  | { type: 'ADD_COMPANY'; payload: Company }
  | { type: 'UPDATE_COMPANY'; payload: Company }
  | { type: 'DELETE_COMPANY'; payload: string }
  | { type: 'ADD_EMPLOYEE'; payload: Employee }
  | { type: 'UPDATE_EMPLOYEE'; payload: Employee }
  | { type: 'DELETE_EMPLOYEE'; payload: string }
  | { type: 'ADD_JOB_INFO'; payload: JobInfo }
  | { type: 'UPDATE_JOB_INFO'; payload: JobInfo }
  | { type: 'ADD_DOCUMENTS'; payload: OfficialDocuments }
  | { type: 'UPDATE_DOCUMENTS'; payload: OfficialDocuments }
  | { type: 'ADD_EMERGENCY_CONTACT'; payload: EmergencyContact }
  | { type: 'UPDATE_EMERGENCY_CONTACT'; payload: EmergencyContact }
  | { type: 'ADD_SKILLS_EXPERIENCE'; payload: SkillsExperience }
  | { type: 'UPDATE_SKILLS_EXPERIENCE'; payload: SkillsExperience }
  | { type: 'LOAD_DATA'; payload: EmployeeState };

const initialState: EmployeeState = {
  companies: [],
  employees: [],
  jobInfos: [],
  documents: [],
  emergencyContacts: [],
  skillsExperiences: [],
};

function employeeReducer(state: EmployeeState, action: EmployeeAction): EmployeeState {
  switch (action.type) {
    case 'ADD_COMPANY':
      return { ...state, companies: [...state.companies, action.payload] };
    case 'UPDATE_COMPANY':
      return {
        ...state,
        companies: state.companies.map(c => c.id === action.payload.id ? action.payload : c)
      };
    case 'DELETE_COMPANY':
      return {
        ...state,
        companies: state.companies.filter(c => c.id !== action.payload)
      };
    case 'ADD_EMPLOYEE':
      return { ...state, employees: [...state.employees, action.payload] };
    case 'UPDATE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.map(e => e.id === action.payload.id ? action.payload : e)
      };
    case 'DELETE_EMPLOYEE':
      return {
        ...state,
        employees: state.employees.filter(e => e.id !== action.payload),
        jobInfos: state.jobInfos.filter(j => j.employeeId !== action.payload),
        documents: state.documents.filter(d => d.employeeId !== action.payload),
        emergencyContacts: state.emergencyContacts.filter(ec => ec.employeeId !== action.payload),
        skillsExperiences: state.skillsExperiences.filter(se => se.employeeId !== action.payload),
      };
    case 'ADD_JOB_INFO':
      return { ...state, jobInfos: [...state.jobInfos, action.payload] };
    case 'UPDATE_JOB_INFO':
      return {
        ...state,
        jobInfos: state.jobInfos.map(j => j.employeeId === action.payload.employeeId ? action.payload : j)
      };
    case 'ADD_DOCUMENTS':
      return { ...state, documents: [...state.documents, action.payload] };
    case 'UPDATE_DOCUMENTS':
      return {
        ...state,
        documents: state.documents.map(d => d.employeeId === action.payload.employeeId ? action.payload : d)
      };
    case 'ADD_EMERGENCY_CONTACT':
      return { ...state, emergencyContacts: [...state.emergencyContacts, action.payload] };
    case 'UPDATE_EMERGENCY_CONTACT':
      return {
        ...state,
        emergencyContacts: state.emergencyContacts.map(ec => ec.employeeId === action.payload.employeeId ? action.payload : ec)
      };
    case 'ADD_SKILLS_EXPERIENCE':
      return { ...state, skillsExperiences: [...state.skillsExperiences, action.payload] };
    case 'UPDATE_SKILLS_EXPERIENCE':
      return {
        ...state,
        skillsExperiences: state.skillsExperiences.map(se => se.employeeId === action.payload.employeeId ? action.payload : se)
      };
    case 'LOAD_DATA':
      return action.payload;
    default:
      return state;
  }
}

interface EmployeeContextType {
  state: EmployeeState;
  dispatch: React.Dispatch<EmployeeAction>;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

export const EmployeeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(employeeReducer, initialState);

  useEffect(() => {
    const savedData = localStorage.getItem('employeeDatabase');
    if (savedData) {
      dispatch({ type: 'LOAD_DATA', payload: JSON.parse(savedData) });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('employeeDatabase', JSON.stringify(state));
  }, [state]);

  return (
    <EmployeeContext.Provider value={{ state, dispatch }}>
      {children}
    </EmployeeContext.Provider>
  );
};

export const useEmployee = () => {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error('useEmployee must be used within an EmployeeProvider');
  }
  return context;
};