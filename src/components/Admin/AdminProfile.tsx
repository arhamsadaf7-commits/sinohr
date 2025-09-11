import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Camera, Save, Mail, UserIcon, Shield } from 'lucide-react';

export const AdminProfile: React.FC = () => {
  const { state, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: state.user?.username || '',
    email: state.user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        throw new Error('New passwords do not match');
      }

      const updateData: any = {
        username: formData.username,
        email: formData.email,
      };

      if (formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      await updateProfile(updateData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        updateProfile({ profilePicture: imageUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!state.user) return null;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center overflow-hidden">
                  {state.user.profilePicture ? (
                    <img
                      src={state.user.profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full cursor-pointer transition-colors">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold">{state.user.username}</h1>
                <p className="text-blue-100 text-lg">{state.user.role.name}</p>
                <p className="text-blue-200 text-sm">{state.user.email}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Profile Information */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter current password to change"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Leave blank to keep current password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Confirm new password"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? 'Updating...' : 'Update Profile'}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Username</label>
                      <p className="text-gray-900 font-medium">{state.user.username}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                      <p className="text-gray-900 font-medium">{state.user.email}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
                      <p className="text-gray-900 font-medium">{state.user.role.name}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        state.user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {state.user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Role & Permissions */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Role & Permissions</h2>
                
                <div className="bg-blue-50 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-900">{state.user.role.name}</h3>
                  </div>
                  <p className="text-blue-700 text-sm">{state.user.role.description}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Module Permissions</h4>
                  <div className="space-y-2">
                    {state.user.role.permissions.map((permission) => (
                      <div key={permission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">{permission.module}</span>
                          <span className="text-gray-500 text-sm ml-2">({permission.resource})</span>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          permission.action === 'write' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {permission.action}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Account Details</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Created: {new Date(state.user.createdAt).toLocaleDateString()}</p>
                    <p>Last Updated: {new Date(state.user.updatedAt).toLocaleDateString()}</p>
                    {state.user.lastLogin && (
                      <p>Last Login: {new Date(state.user.lastLogin).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};