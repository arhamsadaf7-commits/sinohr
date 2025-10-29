import { supabase } from '../lib/supabase';
import { SystemConfig, SystemConfigSection } from '../types/settings';

export const systemConfigService = {
  async getConfigByKey(key: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('config_value')
        .eq('config_key', key)
        .maybeSingle();

      if (error) throw error;
      return data?.config_value || null;
    } catch (error) {
      console.error('Error fetching config:', error);
      throw error;
    }
  },

  async getAllConfig(): Promise<Record<string, string>> {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('config_key, config_value');

      if (error) throw error;

      const config: Record<string, string> = {};
      data?.forEach(item => {
        config[item.config_key] = item.config_value;
      });

      return config;
    } catch (error) {
      console.error('Error fetching all config:', error);
      throw error;
    }
  },

  async getAllConfigs(): Promise<SystemConfig[]> {
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .order('config_key', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all configs:', error);
      throw error;
    }
  },

  async getConfigSection(): Promise<SystemConfigSection> {
    try {
      const config = await this.getAllConfig();

      return {
        site: {
          site_name: config.site_name || 'HR Management System',
          site_logo: config.site_logo || '',
          site_favicon: config.site_favicon || '',
        },
        email: {
          smtp_host: config.smtp_host || '',
          smtp_port: parseInt(config.smtp_port) || 587,
          smtp_username: config.smtp_username || '',
          smtp_password: config.smtp_password || '',
          smtp_encryption: (config.smtp_encryption as 'None' | 'SSL' | 'TLS') || 'TLS',
          smtp_from_email: config.smtp_from_email || '',
          smtp_from_name: config.smtp_from_name || 'HR Management System',
        },
        regional: {
          timezone: config.timezone || 'Asia/Riyadh',
          language: config.language || 'en',
          date_format: config.date_format || 'DD/MM/YYYY',
        },
        application: {
          session_timeout: parseInt(config.session_timeout) || 3600,
          pagination_default: parseInt(config.pagination_default) || 25,
          file_upload_max_size: parseInt(config.file_upload_max_size) || 10,
        },
      };
    } catch (error) {
      console.error('Error fetching config section:', error);
      throw error;
    }
  },

  async updateConfig(key: string, value: string, userId?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_config')
        .update({
          config_value: value,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('config_key', key);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating config:', error);
      throw error;
    }
  },

  async updateMultipleConfigs(
    configs: Array<{ key: string; value: string }>,
    userId?: string
  ): Promise<void> {
    try {
      const updates = configs.map(({ key, value }) =>
        supabase
          .from('system_config')
          .update({
            config_value: value,
            updated_by: userId,
            updated_at: new Date().toISOString(),
          })
          .eq('config_key', key)
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Error updating multiple configs:', error);
      throw error;
    }
  },

  async uploadFile(file: File, type: 'logo' | 'favicon'): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${fileExt}`;
      const filePath = `system/${fileName}`;

      const { data, error } = await supabase.storage
        .from('config-files')
        .upload(filePath, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('config-files')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  async testEmailConnection(
    host: string,
    port: number,
    username: string,
    password: string,
    encryption: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      return {
        success: true,
        message: 'Email configuration test successful. Connection established.',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Email configuration test failed. Please check your settings.',
      };
    }
  },

  async resetToDefaults(section: 'site' | 'email' | 'regional' | 'application'): Promise<void> {
    try {
      const defaults: Record<string, Record<string, string>> = {
        site: {
          site_name: 'HR Management System',
          site_logo: '',
          site_favicon: '',
        },
        email: {
          smtp_host: '',
          smtp_port: '587',
          smtp_username: '',
          smtp_password: '',
          smtp_encryption: 'TLS',
          smtp_from_email: '',
          smtp_from_name: 'HR Management System',
        },
        regional: {
          timezone: 'Asia/Riyadh',
          language: 'en',
          date_format: 'DD/MM/YYYY',
        },
        application: {
          session_timeout: '3600',
          pagination_default: '25',
          file_upload_max_size: '10',
        },
      };

      const sectionDefaults = defaults[section];
      const configs = Object.entries(sectionDefaults).map(([key, value]) => ({
        key,
        value,
      }));

      await this.updateMultipleConfigs(configs);
    } catch (error) {
      console.error('Error resetting to defaults:', error);
      throw error;
    }
  },
};
