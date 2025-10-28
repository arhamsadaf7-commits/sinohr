import React, { useState, useEffect } from 'react';
import {
  Save,
  Upload,
  X,
  Mail,
  Globe,
  Settings as SettingsIcon,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { systemConfigService } from '../../../services/systemConfigService';
import { SystemConfigSection } from '../../../types/settings';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

export const SystemConfigPage: React.FC = () => {
  const { state } = useAuth();
  const [config, setConfig] = useState<SystemConfigSection>({
    site: {
      site_name: '',
      site_logo: '',
      site_favicon: '',
    },
    email: {
      smtp_host: '',
      smtp_port: 587,
      smtp_username: '',
      smtp_password: '',
      smtp_encryption: 'TLS',
      smtp_from_email: '',
      smtp_from_name: '',
    },
    regional: {
      timezone: '',
      language: '',
      date_format: '',
    },
    application: {
      session_timeout: 3600,
      pagination_default: 25,
      file_upload_max_size: 10,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await systemConfigService.getConfigSection();
      setConfig(data);
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSection = async (section: 'site' | 'email' | 'regional' | 'application') => {
    try {
      setSaving(section);
      const updates: Array<{ key: string; value: string }> = [];

      if (section === 'site') {
        updates.push(
          { key: 'site_name', value: config.site.site_name },
          { key: 'site_logo', value: config.site.site_logo },
          { key: 'site_favicon', value: config.site.site_favicon }
        );
      } else if (section === 'email') {
        updates.push(
          { key: 'smtp_host', value: config.email.smtp_host },
          { key: 'smtp_port', value: config.email.smtp_port.toString() },
          { key: 'smtp_username', value: config.email.smtp_username },
          { key: 'smtp_password', value: config.email.smtp_password },
          { key: 'smtp_encryption', value: config.email.smtp_encryption },
          { key: 'smtp_from_email', value: config.email.smtp_from_email },
          { key: 'smtp_from_name', value: config.email.smtp_from_name }
        );
      } else if (section === 'regional') {
        updates.push(
          { key: 'timezone', value: config.regional.timezone },
          { key: 'language', value: config.regional.language },
          { key: 'date_format', value: config.regional.date_format }
        );
      } else if (section === 'application') {
        updates.push(
          { key: 'session_timeout', value: config.application.session_timeout.toString() },
          { key: 'pagination_default', value: config.application.pagination_default.toString() },
          { key: 'file_upload_max_size', value: config.application.file_upload_max_size.toString() }
        );
      }

      await systemConfigService.updateMultipleConfigs(updates, state.user?.id);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(null);
    }
  };

  const handleTestEmail = async () => {
    try {
      setTestingEmail(true);
      const result = await systemConfigService.testEmailConnection(
        config.email.smtp_host,
        config.email.smtp_port,
        config.email.smtp_username,
        config.email.smtp_password,
        config.email.smtp_encryption
      );

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error testing email:', error);
      toast.error('Failed to test email connection');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleResetSection = async (section: 'site' | 'email' | 'regional' | 'application') => {
    if (!confirm(`Are you sure you want to reset ${section} settings to defaults?`)) {
      return;
    }

    try {
      await systemConfigService.resetToDefaults(section);
      toast.success('Settings reset to defaults');
      loadConfig();
    } catch (error) {
      console.error('Error resetting config:', error);
      toast.error('Failed to reset settings');
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon') => {
    try {
      if (type === 'logo' && file.size > 2 * 1024 * 1024) {
        toast.error('Logo file size must be less than 2MB');
        return;
      }
      if (type === 'favicon' && file.size > 100 * 1024) {
        toast.error('Favicon file size must be less than 100KB');
        return;
      }

      const url = await systemConfigService.uploadFile(file, type);
      setConfig(prev => ({
        ...prev,
        site: {
          ...prev.site,
          [type === 'logo' ? 'site_logo' : 'site_favicon']: url,
        },
      }));
      toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully`);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    }
  };

  const formatDate = (format: string): string => {
    const now = new Date();
    const examples: Record<string, string> = {
      'DD/MM/YYYY': '28/10/2025',
      'MM/DD/YYYY': '10/28/2025',
      'YYYY-MM-DD': '2025-10-28',
    };
    return examples[format] || format;
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
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">System Configuration</h1>
          <p className="text-gray-600">Manage system-wide settings and preferences</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Site Information</h2>
                  <p className="text-sm text-gray-600">Configure site name, logo, and branding</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleResetSection('site')}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSaveSection('site')}
                  disabled={saving === 'site'}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving === 'site' ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                <input
                  type="text"
                  value={config.site.site_name}
                  onChange={(e) => setConfig({ ...config, site: { ...config.site, site_name: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="HR Management System"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo (max 2MB)</label>
                  <div className="flex items-center gap-3">
                    {config.site.site_logo && (
                      <img src={config.site.site_logo} alt="Logo" className="h-12 w-12 object-contain" />
                    )}
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Upload Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], 'logo')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Favicon (max 100KB)</label>
                  <div className="flex items-center gap-3">
                    {config.site.site_favicon && (
                      <img src={config.site.site_favicon} alt="Favicon" className="h-8 w-8 object-contain" />
                    )}
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Upload Favicon</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], 'favicon')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Email Settings</h2>
                  <p className="text-sm text-gray-600">Configure SMTP server for email notifications</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleTestEmail}
                  disabled={testingEmail}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {testingEmail ? <AlertCircle className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Test Connection
                </button>
                <button
                  onClick={() => handleResetSection('email')}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSaveSection('email')}
                  disabled={saving === 'email'}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving === 'email' ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                  <input
                    type="text"
                    value={config.email.smtp_host}
                    onChange={(e) => setConfig({ ...config, email: { ...config.email, smtp_host: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                  <input
                    type="number"
                    value={config.email.smtp_port}
                    onChange={(e) => setConfig({ ...config, email: { ...config.email, smtp_port: parseInt(e.target.value) } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    value={config.email.smtp_username}
                    onChange={(e) => setConfig({ ...config, email: { ...config.email, smtp_username: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={config.email.smtp_password}
                    onChange={(e) => setConfig({ ...config, email: { ...config.email, smtp_password: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Encryption</label>
                  <select
                    value={config.email.smtp_encryption}
                    onChange={(e) => setConfig({ ...config, email: { ...config.email, smtp_encryption: e.target.value as any } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="None">None</option>
                    <option value="SSL">SSL</option>
                    <option value="TLS">TLS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                  <input
                    type="email"
                    value={config.email.smtp_from_email}
                    onChange={(e) => setConfig({ ...config, email: { ...config.email, smtp_from_email: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
                  <input
                    type="text"
                    value={config.email.smtp_from_name}
                    onChange={(e) => setConfig({ ...config, email: { ...config.email, smtp_from_name: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Globe className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Regional Settings</h2>
                  <p className="text-sm text-gray-600">Configure timezone, language, and date formats</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleResetSection('regional')}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSaveSection('regional')}
                  disabled={saving === 'regional'}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving === 'regional' ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    value={config.regional.timezone}
                    onChange={(e) => setConfig({ ...config, regional: { ...config.regional, timezone: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                    <option value="Europe/London">Europe/London (GMT+0)</option>
                    <option value="America/New_York">America/New York (GMT-5)</option>
                    <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                  <select
                    value={config.regional.language}
                    onChange={(e) => setConfig({ ...config, regional: { ...config.regional, language: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                  <select
                    value={config.regional.date_format}
                    onChange={(e) => setConfig({ ...config, regional: { ...config.regional, date_format: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY ({formatDate('DD/MM/YYYY')})</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY ({formatDate('MM/DD/YYYY')})</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD ({formatDate('YYYY-MM-DD')})</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <SettingsIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Application Settings</h2>
                  <p className="text-sm text-gray-600">Configure general application behavior</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleResetSection('application')}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSaveSection('application')}
                  disabled={saving === 'application'}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving === 'application' ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (seconds)</label>
                  <input
                    type="number"
                    value={config.application.session_timeout}
                    onChange={(e) => setConfig({ ...config, application: { ...config.application, session_timeout: parseInt(e.target.value) } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Pagination</label>
                  <input
                    type="number"
                    value={config.application.pagination_default}
                    onChange={(e) => setConfig({ ...config, application: { ...config.application, pagination_default: parseInt(e.target.value) } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="10"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max File Size (MB)</label>
                  <input
                    type="number"
                    value={config.application.file_upload_max_size}
                    onChange={(e) => setConfig({ ...config, application: { ...config.application, file_upload_max_size: parseInt(e.target.value) } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
