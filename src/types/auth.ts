export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  permissions: Permission[];
  profilePicture?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  module: string;
  action: string;
  resource: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ExpiryItem {
  id: string;
  employeeId: string;
  employeeName: string;
  documentType: 'iqama' | 'passport' | 'insurance' | 'license' | 'visa' | 'zawil';
  documentNumber: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: 'expired' | 'expiring-soon' | 'expiring-later' | 'valid';
}

export interface ExpiryStats {
  expired: number;
  expiringSoon: number; // 0-15 days
  expiringLater: number; // 16-30 days
  total: number;
}

export interface DashboardData {
  zawil: ExpiryStats & { items: ExpiryItem[] };
  iqama: ExpiryStats & { items: ExpiryItem[] };
  passport: ExpiryStats & { items: ExpiryItem[] };
  insurance: ExpiryStats & { items: ExpiryItem[] };
  license: ExpiryStats & { items: ExpiryItem[] };
  visa: ExpiryStats & { items: ExpiryItem[] };
}