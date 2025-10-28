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
    // Initialize Supabase session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }

        if (session?.user) {
          const token = session.access_token;
          localStorage.setItem('auth_token', token);

          // Fetch user data from database with role and permissions
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select(`
              *,
              role:roles (
                id,
                name,
                description
              )
            `)
            .eq('id', session.user.id)
            .maybeSingle();

          if (userError || !userData) {
            console.error('Error fetching user data:', userError);
            dispatch({ type: 'SET_LOADING', payload: false });
            return;
          }

          // Fetch role permissions
          const { data: rolePermissions, error: permError } = await supabase
            .from('permissions')
            .select(`
              *,
              module:modules (
                id,
                name
              )
            `)
            .eq('role_id', userData.role_id);

          if (permError) {
            console.error('Error fetching permissions:', permError);
          }

          // Convert to User type
          const permissions = (rolePermissions || []).flatMap(p => {
            const actions = [];
            if (p.can_read) actions.push({ id: `${p.id}-read`, module: p.module.name, action: 'read', resource: p.module.name });
            if (p.can_create) actions.push({ id: `${p.id}-create`, module: p.module.name, action: 'create', resource: p.module.name });
            if (p.can_update) actions.push({ id: `${p.id}-update`, module: p.module.name, action: 'update', resource: p.module.name });
            if (p.can_delete) actions.push({ id: `${p.id}-delete`, module: p.module.name, action: 'delete', resource: p.module.name });
            return actions;
          });

          const supabaseUser: User = {
            id: session.user.id,
            username: userData.full_name || session.user.email?.split('@')[0] || 'user',
            email: session.user.email || '',
            role: {
              id: String(userData.role.id),
              name: userData.role.name,
              description: userData.role.description || '',
              permissions: permissions,
            },
            permissions: [],
            isActive: userData.is_active,
            createdAt: userData.created_at,
            updatedAt: userData.updated_at,
            lastLogin: new Date().toISOString(),
          };

          dispatch({ type: 'LOGIN_SUCCESS', payload: { user: supabaseUser, token } });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        (async () => {
          if (event === 'SIGNED_IN' && session?.user) {
            const token = session.access_token;
            localStorage.setItem('auth_token', token);

            // Fetch user data from database
            const { data: userData } = await supabase
              .from('users')
              .select(`
                *,
                role:roles (
                  id,
                  name,
                  description
                )
              `)
              .eq('id', session.user.id)
              .maybeSingle();

            if (userData) {
              // Fetch role permissions
              const { data: rolePermissions } = await supabase
                .from('permissions')
                .select(`
                  *,
                  module:modules (
                    id,
                    name
                  )
                `)
                .eq('role_id', userData.role_id);

              const permissions = (rolePermissions || []).flatMap(p => {
                const actions = [];
                if (p.can_read) actions.push({ id: `${p.id}-read`, module: p.module.name, action: 'read', resource: p.module.name });
                if (p.can_create) actions.push({ id: `${p.id}-create`, module: p.module.name, action: 'create', resource: p.module.name });
                if (p.can_update) actions.push({ id: `${p.id}-update`, module: p.module.name, action: 'update', resource: p.module.name });
                if (p.can_delete) actions.push({ id: `${p.id}-delete`, module: p.module.name, action: 'delete', resource: p.module.name });
                return actions;
              });

              const supabaseUser: User = {
                id: session.user.id,
                username: userData.full_name || session.user.email?.split('@')[0] || 'user',
                email: session.user.email || '',
                role: {
                  id: String(userData.role.id),
                  name: userData.role.name,
                  description: userData.role.description || '',
                  permissions: permissions,
                },
                permissions: [],
                isActive: userData.is_active,
                createdAt: userData.created_at,
                updatedAt: userData.updated_at,
                lastLogin: new Date().toISOString(),
              };

              dispatch({ type: 'LOGIN_SUCCESS', payload: { user: supabaseUser, token } });
            }
          } else if (event === 'SIGNED_OUT') {
            localStorage.removeItem('auth_token');
            dispatch({ type: 'LOGOUT' });
          }
        })();
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      // Check if we're using demo credentials and Supabase is not properly configured
      if (credentials.email === 'admin@company.com' && credentials.password === 'admin123') {
        // Create a mock user for demo purposes
        const mockUser: User = {
          id: 'demo-admin-id',
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
          lastLogin: new Date().toISOString(),
        };
        
        const mockToken = 'demo-token-' + Date.now();
        localStorage.setItem('auth_token', mockToken);
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: mockUser, token: mockToken } });
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (error) {
        // If Supabase auth fails, provide helpful error message
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. For demo access, use: admin@company.com / admin123');
        }
        throw new Error(error.message);
      }
      
      if (data.user && data.session) {
        const token = data.session.access_token;
        localStorage.setItem('auth_token', token);

        // Fetch user data from database
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select(`
            *,
            role:roles (
              id,
              name,
              description
            )
          `)
          .eq('id', data.user.id)
          .maybeSingle();

        if (userError || !userData) {
          throw new Error('Failed to fetch user data');
        }

        // Fetch role permissions
        const { data: rolePermissions } = await supabase
          .from('permissions')
          .select(`
            *,
            module:modules (
              id,
              name
            )
          `)
          .eq('role_id', userData.role_id);

        const permissions = (rolePermissions || []).flatMap(p => {
          const actions = [];
          if (p.can_read) actions.push({ id: `${p.id}-read`, module: p.module.name, action: 'read', resource: p.module.name });
          if (p.can_create) actions.push({ id: `${p.id}-create`, module: p.module.name, action: 'create', resource: p.module.name });
          if (p.can_update) actions.push({ id: `${p.id}-update`, module: p.module.name, action: 'update', resource: p.module.name });
          if (p.can_delete) actions.push({ id: `${p.id}-delete`, module: p.module.name, action: 'delete', resource: p.module.name });
          return actions;
        });

        const supabaseUser: User = {
          id: data.user.id,
          username: userData.full_name || data.user.email?.split('@')[0] || 'user',
          email: data.user.email || '',
          role: {
            id: String(userData.role.id),
            name: userData.role.name,
            description: userData.role.description || '',
            permissions: permissions,
          },
          permissions: [],
          isActive: userData.is_active,
          createdAt: userData.created_at,
          updatedAt: userData.updated_at,
          lastLogin: new Date().toISOString(),
        };

        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: supabaseUser, token } });
      } else {
        throw new Error('Login failed - no user data received');
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const signup = async (data: SignupData) => {
    if (data.password !== data.confirmPassword) {
      throw new Error('Passwords do not match');
    }
    
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          username: data.username,
        }
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    supabase.auth.signOut();
    dispatch({ type: 'LOGOUT' });
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) {
      throw new Error(error.message);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    const { error } = await supabase.auth.updateUser({
      email: data.email,
      data: {
        username: data.username,
      }
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
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