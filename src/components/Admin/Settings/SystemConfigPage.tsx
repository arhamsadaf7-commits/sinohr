import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Settings } from 'lucide-react';
import { systemConfigService } from '../../../services/systemConfigService';
import { SystemConfig } from '../../../types/settings';
import toast from 'react-hot-toast';

export const SystemConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedConfigs, setEditedConfigs] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await systemConfigService.getAllConfigs();
      setConfigs(data);

      const edited: { [key: string]: string } = {};
      data.forEach(config => {
        edited[config.config_key] = config.config_value || '';
      });
      setEditedConfigs(edited);
    } catch (error) {
      console.error('Error loading configs:', error);
      toast.error('Failed to load system configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: string, value: string) => {
    setEditedConfigs(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      for (const [key, value] of Object.entries(editedConfigs)) {
        const config = configs.find(c => c.config_key === key);
        if (config && config.config_value !== value) {
          await systemConfigService.updateConfig(key, value);
        }
      }
      toast.success('System configuration saved successfully');
      loadConfigs();
    } catch (error) {
      console.error('Error saving configs:', error);
      toast.error('Failed to save system configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const edited: { [key: string]: string } = {};
    configs.forEach(config => {
      edited[config.config_key] = config.config_value || '';
    });
    setEditedConfigs(edited);
    toast.success('Configuration reset to last saved values');
  };

  const renderConfigInput = (config: SystemConfig) => {
    const value = editedConfigs[config.config_key] || '';

    switch (config.config_type) {
      case 'boolean':
        return (
          <select
            value={value}
            onChange={(e) => handleConfigChange(config.config_key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        );
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleConfigChange(config.config_key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );
      case 'json':
        return (
          <textarea
            value={value}
            onChange={(e) => handleConfigChange(config.config_key, e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder="Enter valid JSON"
          />
        );
      default:
        return (
          <input
            type={config.is_encrypted ? 'password' : 'text'}
            value={value}
            onChange={(e) => handleConfigChange(config.config_key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );
    }
  };

  const groupConfigsByCategory = () => {
    const grouped: { [category: string]: SystemConfig[] } = {};

    configs.forEach(config => {
      const category = config.config_key.split('_')[0] || 'General';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(config);
    });

    return grouped;
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

  const groupedConfigs = groupConfigsByCategory();

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">System Configuration</h1>
          <p className="text-gray-600">Manage system-wide settings and configurations</p>
        </div>

        <div className="mb-6 flex justify-end gap-3">
          <button
            onClick={handleReset}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedConfigs).map(([category, categoryConfigs]) => (
            <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 capitalize">{category} Settings</h2>
              </div>
              <div className="p-6 space-y-4">
                {categoryConfigs.map((config) => (
                  <div key={config.id} className="grid grid-cols-3 gap-4 items-start">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {config.config_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Type: {config.config_type}
                        {config.is_encrypted && ' (Encrypted)'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      {renderConfigInput(config)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {configs.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No system configuration settings found</p>
              <p className="text-sm text-gray-400 mt-2">Configuration settings will appear here when added</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
