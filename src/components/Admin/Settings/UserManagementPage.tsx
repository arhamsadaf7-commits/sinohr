import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { userManagementService } from '../../../services/userManagementService';
import { permissionsService } from '../../../services/permissionsService';
import { SystemUser, CreateUserFormData, UserFilter, EmployeeSelectOption, Role } from '../../../types/settings';
import toast from 'react-hot-toast';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [employees, setEmployees] = useState<EmployeeSelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [filter, setFilter] = useState<UserFilter>({
    search: '',
    user_type: '',
    role_id: undefined,
    source: '',
    is_active: undefined,
  });

  const [formData, setFormData] = useState<CreateUserFormData>({
    source: 'Manual',
    employee_id: undefined,
    supplier_user_id: undefined,
    full_name: '',
    email: '',
    phone: '',
    password: '',
    user_type: 'Employee',
    role_id: 0,
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [filter]);

  const loadData = async () => {
    try {
      const [rolesData, employeesData] = await Promise.all([
        permissionsService.getRoles(),
        userManagementService.getEmployees(),
      ]);
      setRoles(rolesData);
      setEmployees(employeesData);
      if (rolesData.length > 0) {
        setFormData(prev => ({ ...prev, role_id: rolesData[0].id }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userManagementService.getUsers(filter);
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSourceChange = (source: 'Manual' | 'Employee' | 'Supplier') => {
    setFormData(prev => ({
      ...prev,
      source,
      employee_id: undefined,
      supplier_user_id: undefined,
      full_name: '',
      email: '',
      phone: '',
    }));
  };

  const handleEmployeeSelect = (employeeId: number) => {
    const employee = employees.find(e => e.employee_id === employeeId);
    if (employee) {
      setFormData(prev => ({
        ...prev,
        employee_id: employeeId,
        full_name: employee.english_name,
        email: prev.email || `${employee.moi_number}@company.com`,
      }));
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!formData.full_name || !formData.email || !formData.role_id) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (formData.source === 'Manual' && !formData.password) {
        toast.error('Password is required for manual user creation');
        return;
      }

      await userManagementService.createUser(formData);
      toast.success('User created successfully');
      setShowCreateModal(false);
      resetForm();
      loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    try {
      if (!editingUser) return;

      await userManagementService.updateUser(editingUser.id, {
        user_type: formData.user_type,
        role_id: formData.role_id,
        full_name: formData.full_name,
        phone: formData.phone,
        is_active: formData.is_active,
      });

      toast.success('User updated successfully');
      setEditingUser(null);
      setShowCreateModal(false);
      resetForm();
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await userManagementService.deleteUser(userId);
      toast.success('User deleted successfully');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await userManagementService.toggleUserStatus(userId, !currentStatus);
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleEdit = (user: SystemUser) => {
    setEditingUser(user);
    setFormData({
      source: user.source,
      employee_id: user.employee_id,
      supplier_user_id: undefined,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      user_type: user.user_type,
      role_id: user.role_id,
      is_active: user.is_active,
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      source: 'Manual',
      employee_id: undefined,
      supplier_user_id: undefined,
      full_name: '',
      email: '',
      phone: '',
      password: '',
      user_type: 'Employee',
      role_id: roles[0]?.id || 0,
      is_active: true,
    });
    setEditingUser(null);
  };

  const userTypes = ['Admin', 'Admin Assistant', 'Manager', 'Employee', 'Supplier', 'Viewer'];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Create and manage system users with role-based access</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create User
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filter.user_type}
              onChange={(e) => setFilter({ ...filter, user_type: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All User Types</option>
              {userTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={filter.role_id || ''}
              onChange={(e) => setFilter({ ...filter, role_id: e.target.value ? parseInt(e.target.value) : undefined })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>

            <select
              value={filter.is_active === undefined ? '' : filter.is_active.toString()}
              onChange={(e) => setFilter({ ...filter, is_active: e.target.value === '' ? undefined : e.target.value === 'true' })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-medium text-gray-700">User</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-700">Type</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-700">Role</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-700">Source</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-700">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">{user.full_name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          {user.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                          {user.user_type}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-medium text-gray-900">{user.role?.name}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm text-gray-600">{user.source}</span>
                        {user.employee && (
                          <p className="text-xs text-gray-500">Linked: {user.employee.english_name}</p>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleStatus(user.id, user.is_active)}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            user.is_active
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {user.is_active ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                          {user.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Source *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['Manual', 'Employee', 'Supplier'] as const).map((source) => (
                      <button
                        key={source}
                        onClick={() => handleSourceChange(source)}
                        className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                          formData.source === source
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {source}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {formData.source === 'Employee' && !editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee *</label>
                  <select
                    value={formData.employee_id || ''}
                    onChange={(e) => handleEmployeeSelect(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select an employee</option>
                    {employees.map((emp) => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.english_name} - {emp.moi_number}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={editingUser !== null}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {formData.source === 'Manual' && !editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">User Type *</label>
                  <select
                    value={formData.user_type}
                    onChange={(e) => setFormData({ ...formData, user_type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {userTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                  <select
                    value={formData.role_id}
                    onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Active User
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={editingUser ? handleUpdateUser : handleCreateUser}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {editingUser ? 'Update User' : 'Create User'}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
