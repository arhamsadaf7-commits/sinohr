import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Search,
  Filter,
  UserCheck,
  UserX,
  Settings
} from 'lucide-react';
import { User, UserRole, Permission } from '../../types/auth';

export const UserManagement: React.FC = () => {
  const { state, checkPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([
    {
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
    },
    {
      id: '2',
      username: 'hr_manager',
      email: 'hr@company.com',
      role: {
        id: '2',
        name: 'HR Manager',
        description: 'HR module access',
        permissions: [
          { id: '1', module: 'HR', action: 'read', resource: 'employees' },
          { id: '2', module: 'HR', action: 'write', resource: 'employees' },
        ],
      },
      permissions: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  const [roles] = useState<UserRole[]>([
    {
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
    {
      id: '2',
      name: 'HR Manager',
      description: 'HR module access',
      permissions: [
        { id: '1', module: 'HR', action: 'read', resource: 'employees' },
        { id: '2', module: 'HR', action: 'write', resource: 'employees' },
      ],
    },
    {
      id: '3',
      name: 'Finance Manager',
      description: 'Finance module access',
      permissions: [
        { id: '3', module: 'Finance', action: 'read', resource: 'reports' },
        { id: '6', module: 'Finance', action: 'write', resource: 'reports' },
      ],
    },
    {
      id: '4',
      name: 'Security Officer',
      description: 'Security module access',
      permissions: [
        { id: '4', module: 'Security', action: 'read', resource: 'logs' },
      ],
    },
  ]);

  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    roleId: '',
    isActive: true,
  });

  const canManageUsers = checkPermission('Admin', 'write');

  const handleCreateUser = () => {
    if (!canManageUsers) return;
    
    const selectedRoleData = roles.find(r => r.id === formData.roleId);
    if (!selectedRoleData) return;

    const newUser: User = {
      id: Date.now().toString(),
      username: formData.username,
      email: formData.email,
      role: selectedRoleData,
      permissions: [],
      isActive: formData.isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setUsers([...users, newUser]);
    setShowUserForm(false);
    setFormData({ username: '', email: '', password: '', roleId: '', isActive: true });
  };

  const handleEditUser = (user: User) => {
    if (!canManageUsers) return;
    
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      roleId: user.role.id,
      isActive: user.isActive,
    });
    setShowUserForm(true);
  };

  const handleUpdateUser = () => {
    if (!canManageUsers || !editingUser) return;
    
    const selectedRoleData = roles.find(r => r.id === formData.roleId);
    if (!selectedRoleData) return;

    const updatedUsers = users.map(user => 
      user.id === editingUser.id 
        ? {
            ...user,
            username: formData.username,
            email: formData.email,
            role: selectedRoleData,
            isActive: formData.isActive,
            updatedAt: new Date().toISOString(),
          }
        : user
    );

    setUsers(updatedUsers);
    setShowUserForm(false);
    setEditingUser(null);
    setFormData({ username: '', email: '', password: '', roleId: '', isActive: true });
  };

  const handleDeleteUser = (userId: string) => {
    if (!canManageUsers) return;
    
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const toggleUserStatus = (userId: string) => {
    if (!canManageUsers) return;
    
    const updatedUsers = users.map(user => 
      user.id === userId 
        ? { ...user, isActive: !user.isActive, updatedAt: new Date().toISOString() }
        : user
    );
    setUsers(updatedUsers);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || user.role.id === selectedRole;
    return matchesSearch && matchesRole;
  });

  if (!canManageUsers) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to manage users.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage system users and their permissions</p>
          </div>
          <button
            onClick={() => setShowUserForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="">All Roles</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">User</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Role</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Status</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Created</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-gray-900">{user.username}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-gray-900">{user.role.name}</p>
                        <p className="text-sm text-gray-600">{user.role.description}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        } transition-colors`}
                      >
                        {user.isActive ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                        {user.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
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
        </div>

        {/* User Form Modal */}
        {showUserForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {editingUser ? 'Edit User' : 'Create New User'}
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      value={formData.roleId}
                      onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Role</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                      Active User
                    </label>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={editingUser ? handleUpdateUser : handleCreateUser}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingUser ? 'Update User' : 'Create User'}
                  </button>
                  <button
                    onClick={() => {
                      setShowUserForm(false);
                      setEditingUser(null);
                      setFormData({ username: '', email: '', password: '', roleId: '', isActive: true });
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Role Permissions Overview */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Role Permissions Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map(role => (
              <div key={role.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-gray-900">{role.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">{role.description}</p>
                <div className="space-y-1">
                  {role.permissions.map(permission => (
                    <div key={permission.id} className="text-xs bg-gray-50 px-2 py-1 rounded">
                      {permission.module} - {permission.action}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};