import { useAuth } from '../context/AuthContext';

export const usePermissions = () => {
  const { state } = useAuth();

  const hasPermission = (moduleName: string, action: 'create' | 'read' | 'update' | 'delete'): boolean => {
    if (!state.user) return false;

    const permission = state.user.role.permissions.find(
      p => p.module === moduleName && p.action === action
    );

    return !!permission;
  };

  const canCreate = (moduleName: string) => hasPermission(moduleName, 'create');
  const canRead = (moduleName: string) => hasPermission(moduleName, 'read');
  const canUpdate = (moduleName: string) => hasPermission(moduleName, 'update');
  const canDelete = (moduleName: string) => hasPermission(moduleName, 'delete');

  const hasAnyPermission = (moduleName: string): boolean => {
    if (!state.user) return false;

    return state.user.role.permissions.some(p => p.module === moduleName);
  };

  const getModulePermissions = (moduleName: string) => {
    return {
      canCreate: canCreate(moduleName),
      canRead: canRead(moduleName),
      canUpdate: canUpdate(moduleName),
      canDelete: canDelete(moduleName),
    };
  };

  return {
    hasPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    hasAnyPermission,
    getModulePermissions,
  };
};
