import React, { useState, useEffect } from 'react';
import { Shield, Check, X, RefreshCw, Save } from 'lucide-react';
import { permissionsService } from '../../../services/permissionsService';
import { userManagementService } from '../../../services/userManagementService';
import { Role, Module, RolePermission, MergedPermissions, SystemUser } from '../../../types/settings';
import toast from 'react-hot-toast';

export const ModulePermissionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'role' | 'user'>('role');
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [userPermissions, setUserPermissions] = useState<MergedPermissions>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedRole && activeTab === 'role') {
      loadRolePermissions();
    }
  }, [selectedRole, activeTab]);

  useEffect(() => {
    if (selectedUser && activeTab === 'user') {
      loadUserPermissions();
    }
  }, [selectedUser, activeTab]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [rolesData, modulesData, usersData] = await Promise.all([
        permissionsService.getRoles(),
        permissionsService.getModules(),
        userManagementService.getUsers({ is_active: true }),
      ]);
      setRoles(rolesData);
      setModules(modulesData);
      setUsers(usersData);
      if (rolesData.length > 0) {
        setSelectedRole(rolesData[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadRolePermissions = async () => {
    if (!selectedRole) return;
    try {
      const permissions = await permissionsService.getRolePermissions(selectedRole);
      setRolePermissions(permissions);
    } catch (error) {
      console.error('Error loading role permissions:', error);
      toast.error('Failed to load role permissions');
    }
  };

  const loadUserPermissions = async () => {
    if (!selectedUser) return;
    try {
      const user = users.find(u => u.id === selectedUser);
      if (!user) return;

      const merged = await permissionsService.getMergedPermissions(selectedUser, user.role_id);
      setUserPermissions(merged);
    } catch (error) {
      console.error('Error loading user permissions:', error);
      toast.error('Failed to load user permissions');
    }
  };

  const handleRolePermissionChange = (moduleId: number, field: 'can_create' | 'can_read' | 'can_update' | 'can_delete', value: boolean) => {
    setRolePermissions(prev => {
      const existing = prev.find(p => p.module_id === moduleId);
      if (existing) {
        return prev.map(p =>
          p.module_id === moduleId ? { ...p, [field]: value } : p
        );
      } else {
        return [...prev, {
          id: 0,
          role_id: selectedRole!,
          module_id: moduleId,
          can_create: field === 'can_create' ? value : false,
          can_read: field === 'can_read' ? value : false,
          can_update: field === 'can_update' ? value : false,
          can_delete: field === 'can_delete' ? value : false,
        }];
      }
    });
  };

  const handleUserPermissionChange = (moduleId: number, field: 'can_create' | 'can_read' | 'can_update' | 'can_delete', value: boolean) => {
    setUserPermissions(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [field]: value,
        is_override: true,
      },
    }));
  };

  const handleToggleInheritance = (moduleId: number) => {
    setUserPermissions(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        is_override: !prev[moduleId].is_override,
      },
    }));
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return;

    try {
      setSaving(true);
      const permissionsToSave = modules.map(module => {
        const perm = rolePermissions.find(p => p.module_id === module.id);
        return {
          module_id: module.id,
          can_create: perm?.can_create || false,
          can_read: perm?.can_read || false,
          can_update: perm?.can_update || false,
          can_delete: perm?.can_delete || false,
        };
      });

      await permissionsService.updateRolePermissions(selectedRole, permissionsToSave);
      toast.success('Role permissions saved successfully');
    } catch (error) {
      console.error('Error saving role permissions:', error);
      toast.error('Failed to save role permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUserPermissions = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      for (const [moduleId, perms] of Object.entries(userPermissions)) {
        if (perms.is_override) {
          await permissionsService.updateUserPermission(selectedUser, parseInt(moduleId), {
            can_create: perms.can_create,
            can_read: perms.can_read,
            can_update: perms.can_update,
            can_delete: perms.can_delete,
            inherit_from_role: false,
          });
        }
      }
      toast.success('User permissions saved successfully');
      loadUserPermissions();
    } catch (error) {
      console.error('Error saving user permissions:', error);
      toast.error('Failed to save user permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleResetUserPermissions = async () => {
    if (!selectedUser) return;
    if (!confirm('Are you sure you want to reset all user permissions to role defaults?')) return;

    try {
      await permissionsService.resetUserPermissions(selectedUser);
      toast.success('User permissions reset successfully');
      loadUserPermissions();
    } catch (error) {
      console.error('Error resetting user permissions:', error);
      toast.error('Failed to reset user permissions');
    }
  };

  const getRolePermission = (moduleId: number, field: 'can_create' | 'can_read' | 'can_update' | 'can_delete'): boolean => {
    const perm = rolePermissions.find(p => p.module_id === moduleId);
    return perm ? perm[field] : false;
  };

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Module Permissions</h1>
          <p className="text-gray-600">Manage role-based and user-specific access permissions</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('role')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'role'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Role Permissions
              </button>
              <button
                onClick={() => setActiveTab('user')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'user'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                User Permissions
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'role' ? (
              <>
                <div className="mb-6 flex justify-between items-center">
                  <div className="flex-1 max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
                    <select
                      value={selectedRole || ''}
                      onChange={(e) => setSelectedRole(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                    {selectedRole && (
                      <p className="text-sm text-gray-600 mt-2">
                        {roles.find(r => r.id === selectedRole)?.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleSaveRolePermissions}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Permissions'}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Module</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Create</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Read</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Update</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modules.map((module) => (
                        <tr key={module.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium text-gray-900">{module.name}</p>
                              <p className="text-sm text-gray-600">{module.description}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={getRolePermission(module.id, 'can_create')}
                              onChange={(e) => handleRolePermissionChange(module.id, 'can_create', e.target.checked)}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={getRolePermission(module.id, 'can_read')}
                              onChange={(e) => handleRolePermissionChange(module.id, 'can_read', e.target.checked)}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={getRolePermission(module.id, 'can_update')}
                              onChange={(e) => handleRolePermissionChange(module.id, 'can_update', e.target.checked)}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={getRolePermission(module.id, 'can_delete')}
                              onChange={(e) => handleRolePermissionChange(module.id, 'can_delete', e.target.checked)}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6 flex justify-between items-center">
                  <div className="flex-1 max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
                    <select
                      value={selectedUser || ''}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Choose a user</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.full_name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleResetUserPermissions}
                      disabled={!selectedUser || saving}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reset to Role
                    </button>
                    <button
                      onClick={handleSaveUserPermissions}
                      disabled={!selectedUser || saving}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Permissions'}
                    </button>
                  </div>
                </div>

                {selectedUser && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Module</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-700">Create</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-700">Read</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-700">Update</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-700">Delete</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-700">Override</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modules.map((module) => {
                          const perms = userPermissions[module.id];
                          if (!perms) return null;

                          return (
                            <tr key={module.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-medium text-gray-900">{module.name}</p>
                                  <p className="text-sm text-gray-600">{module.description}</p>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={perms.can_create}
                                  onChange={(e) => handleUserPermissionChange(module.id, 'can_create', e.target.checked)}
                                  disabled={!perms.is_override}
                                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                                />
                              </td>
                              <td className="py-3 px-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={perms.can_read}
                                  onChange={(e) => handleUserPermissionChange(module.id, 'can_read', e.target.checked)}
                                  disabled={!perms.is_override}
                                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                                />
                              </td>
                              <td className="py-3 px-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={perms.can_update}
                                  onChange={(e) => handleUserPermissionChange(module.id, 'can_update', e.target.checked)}
                                  disabled={!perms.is_override}
                                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                                />
                              </td>
                              <td className="py-3 px-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={perms.can_delete}
                                  onChange={(e) => handleUserPermissionChange(module.id, 'can_delete', e.target.checked)}
                                  disabled={!perms.is_override}
                                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                                />
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  onClick={() => handleToggleInheritance(module.id)}
                                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                    perms.is_override
                                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}
                                >
                                  {perms.is_override ? 'Override' : 'Inherit'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {!selectedUser && (
                  <div className="text-center py-8 text-gray-500">
                    Please select a user to manage permissions
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
