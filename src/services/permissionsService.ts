import { supabase } from '../lib/supabase';
import { Role, Module, RolePermission, UserPermission, MergedPermissions } from '../types/settings';

export const permissionsService = {
  async getRoles(): Promise<Role[]> {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  async getModules(): Promise<Module[]> {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching modules:', error);
      throw error;
    }
  },

  async getRolePermissions(roleId: number): Promise<RolePermission[]> {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('role_id', roleId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      throw error;
    }
  },

  async updateRolePermissions(
    roleId: number,
    permissions: Array<{
      module_id: number;
      can_create: boolean;
      can_read: boolean;
      can_update: boolean;
      can_delete: boolean;
    }>
  ): Promise<void> {
    try {
      const { error: deleteError } = await supabase
        .from('permissions')
        .delete()
        .eq('role_id', roleId);

      if (deleteError) throw deleteError;

      const permissionsToInsert = permissions.map(p => ({
        role_id: roleId,
        ...p,
      }));

      const { error: insertError } = await supabase
        .from('permissions')
        .insert(permissionsToInsert);

      if (insertError) throw insertError;
    } catch (error) {
      console.error('Error updating role permissions:', error);
      throw error;
    }
  },

  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      throw error;
    }
  },

  async updateUserPermission(
    userId: string,
    moduleId: number,
    permissions: {
      can_create: boolean;
      can_read: boolean;
      can_update: boolean;
      can_delete: boolean;
      inherit_from_role: boolean;
    }
  ): Promise<void> {
    try {
      const { data: existing } = await supabase
        .from('user_permissions')
        .select('id')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_permissions')
          .update(permissions)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_permissions')
          .insert({
            user_id: userId,
            module_id: moduleId,
            ...permissions,
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating user permission:', error);
      throw error;
    }
  },

  async resetUserPermissions(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error resetting user permissions:', error);
      throw error;
    }
  },

  async getMergedPermissions(userId: string, roleId: number): Promise<MergedPermissions> {
    try {
      const [modules, rolePermissions, userPermissions] = await Promise.all([
        this.getModules(),
        this.getRolePermissions(roleId),
        this.getUserPermissions(userId),
      ]);

      const merged: MergedPermissions = {};

      modules.forEach(module => {
        const rolePerms = rolePermissions.find(p => p.module_id === module.id);
        const userPerms = userPermissions.find(p => p.module_id === module.id);

        if (userPerms && !userPerms.inherit_from_role) {
          merged[module.id] = {
            module,
            can_create: userPerms.can_create,
            can_read: userPerms.can_read,
            can_update: userPerms.can_update,
            can_delete: userPerms.can_delete,
            is_override: true,
          };
        } else if (rolePerms) {
          merged[module.id] = {
            module,
            can_create: rolePerms.can_create,
            can_read: rolePerms.can_read,
            can_update: rolePerms.can_update,
            can_delete: rolePerms.can_delete,
            is_override: false,
          };
        } else {
          merged[module.id] = {
            module,
            can_create: false,
            can_read: false,
            can_update: false,
            can_delete: false,
            is_override: false,
          };
        }
      });

      return merged;
    } catch (error) {
      console.error('Error getting merged permissions:', error);
      throw error;
    }
  },
};
