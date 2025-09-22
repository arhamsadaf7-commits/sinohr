import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, AuthState, LoginCredentials, SignupData } from '../types/auth';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  checkPermission: (module: string, action: string) => boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: false,
  loading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGIN_FAILURE':
      return { ...state, loading: false, isAuthenticated: false };
    case 'LOGOUT':
      return { ...initialState, loading: false, token: null };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Use stored token to restore session
      const mockUser: User = {
        id: '1',
        username: 'admin',
        email: 'admin@company.com',
        role: {
          id: '1',
          name: 'Super Admin',
          description: 'Full system access',
          permissions: [
            { id: '1', module: 'HR', action: 'read', resource: 'employees' },
            { id: '2', module: 'HR', action: 'write', resource: 'employees' },
            { id: '3', module: 'Finance', action: 'read', resource: 'reports' },
            { id: '4', module: 'Security', action: 'read', resource: 'logs' },
            { id: '5', module: 'Admin', action: 'write', resource: 'users' },
          ],
        },
        permissions: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: mockUser, token } });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // Try Supabase authentication first
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });
        
        if (error) throw error;
        
        if (data.user) {
          // Handle Supabase user
          const token = data.session?.access_token || 'supabase_token';
          localStorage.setItem('auth_token', token);
          
          const supabaseUser: User = {
            id: data.user.id,
            username: data.user.email?.split('@')[0] || 'user',
            email: data.user.email || '',
            role: {
              id: '1',
              name: 'User',
              description: 'Standard user access',
              permissions: [
                { id: '1', module: 'HR', action: 'read', resource: 'employees' },
              ],
            },
            permissions: [],
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
          };
          
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user: supabaseUser, token } });
          return;
        }
      } catch (supabaseError) {
        console.log('Supabase auth failed, trying mock auth:', supabaseError);
      }
      
      // Fallback to mock authentication
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (credentials.email === 'admin@company.com' && credentials.password === 'admin123') {
        const mockUser: User = {
          id: '1',
          username: 'admin',
          email: credentials.email,
          role: {
            id: '1',
            name: 'Super Admin',
            description: 'Full system access',
            permissions: [
              { id: '1', module: 'HR', action: 'read', resource: 'employees' },
              { id: '2', module: 'HR', action: 'write', resource: 'employees' },
              { id: '3', module: 'Finance', action: 'read', resource: 'reports' },
              { id: '4', module: 'Security', action: 'read', resource: 'logs' },
              { id: '5', module: 'Admin', action: 'write', resource: 'users' },
            ],
          },
          permissions: [],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        
        const token = 'mock_jwt_token_' + Date.now();
        localStorage.setItem('auth_token', token);
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: mockUser, token } });
      } else {
        throw new Error('Invalid credentials. Use admin@company.com / admin123 for demo.');
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const signup = async (data: SignupData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (data.password !== data.confirmPassword) {
      throw new Error('Passwords do not match');
    }
    
    // In a real app, this would create a new user
    console.log('User created:', data);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    supabase.auth.signOut(); // Also sign out from Supabase
    dispatch({ type: 'LOGOUT' });
  };

  const resetPassword = async (email: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Password reset email sent to:', email);
  };

  const updateProfile = async (data: Partial<User>) => {
    // Simulate profile update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (state.user) {
      const updatedUser = { ...state.user, ...data, updatedAt: new Date().toISOString() };
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
    }
  };

  const checkPermission = (module: string, action: string): boolean => {
    if (!state.user) return false;
    
    return state.user.role.permissions.some(
      permission => permission.module === module && permission.action === action
    );
  };

  return (
    <AuthContext.Provider value={{
      state,
      login,
      signup,
      logout,
      resetPassword,
      updateProfile,
      checkPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};