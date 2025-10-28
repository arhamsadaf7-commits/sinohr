import { supabase } from '../lib/supabase';
import { SystemUser, CreateUserFormData, UserFilter } from '../types/settings';

export const userManagementService = {
  async getUsers(filter?: UserFilter): Promise<SystemUser[]> {
    try {
      let query = supabase
        .from('users')
        .select(`
          *,
          role:roles(id, name, description),
          employee:employees(employee_id, english_name, arabic_name, moi_number)
        `);

      if (filter?.search) {
        query = query.or(`full_name.ilike.%${filter.search}%,email.ilike.%${filter.search}%`);
      }

      if (filter?.user_type) {
        query = query.eq('user_type', filter.user_type);
      }

      if (filter?.role_id) {
        query = query.eq('role_id', filter.role_id);
      }

      if (filter?.source) {
        query = query.eq('source', filter.source);
      }

      if (filter?.is_active !== undefined) {
        query = query.eq('is_active', filter.is_active);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  async getUserById(userId: string): Promise<SystemUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          role:roles(id, name, description),
          employee:employees(employee_id, english_name, arabic_name, moi_number)
        `)
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  async createUser(formData: CreateUserFormData): Promise<SystemUser> {
    try {
      let authUserId: string;

      if (formData.source === 'Manual') {
        if (!formData.password) {
          throw new Error('Password is required for manual user creation');
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create auth user');
        authUserId = authData.user.id;
      } else if (formData.source === 'Employee') {
        if (!formData.employee_id) {
          throw new Error('Employee ID is required when creating from employee');
        }

        const tempPassword = Math.random().toString(36).slice(-12);
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: tempPassword,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create auth user');
        authUserId = authData.user.id;
      } else {
        throw new Error('Invalid source type');
      }

      const { data, error } = await supabase
        .from('users')
        .insert({
          id: authUserId,
          user_type: formData.user_type,
          role_id: formData.role_id,
          employee_id: formData.employee_id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          source: formData.source,
          is_active: formData.is_active,
        })
        .select(`
          *,
          role:roles(id, name, description),
          employee:employees(employee_id, english_name, arabic_name, moi_number)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async updateUser(userId: string, updates: Partial<SystemUser>): Promise<SystemUser> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          user_type: updates.user_type,
          role_id: updates.role_id,
          full_name: updates.full_name,
          phone: updates.phone,
          is_active: updates.is_active,
        })
        .eq('id', userId)
        .select(`
          *,
          role:roles(id, name, description),
          employee:employees(employee_id, english_name, arabic_name, moi_number)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  async deleteUser(userId: string): Promise<void> {
    try {
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (userError) throw userError;

      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) console.error('Error deleting auth user:', authError);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  async toggleUserStatus(userId: string, isActive: boolean): Promise<SystemUser> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ is_active: isActive })
        .eq('id', userId)
        .select(`
          *,
          role:roles(id, name, description),
          employee:employees(employee_id, english_name, arabic_name, moi_number)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  },

  async getEmployees() {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('employee_id, english_name, arabic_name, moi_number, passport_number, nationality')
        .order('english_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },

  async getSupplierUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email, phone')
        .eq('user_type', 'Supplier')
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching supplier users:', error);
      throw error;
    }
  },
};
