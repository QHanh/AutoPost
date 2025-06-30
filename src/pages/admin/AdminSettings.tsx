import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RefreshCw, 
  Shield, 
  Bell, 
  Settings as SettingsIcon,
  Globe,
  Database
} from 'lucide-react';
import { adminApiService } from '../../services/adminApiService.js';
import { SystemSettings } from '../../types/admin.js';

const SettingCard: React.FC<{
  setting: SystemSettings;
  onUpdate: (id: string, value: any) => void;
}> = ({ setting, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(setting.value);

  const handleSave = () => {
    onUpdate(setting.id, value);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(setting.value);
    setIsEditing(false);
  };

  const renderInput = () => {
    if (typeof setting.value === 'boolean') {
      return (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={value as boolean}
            onChange={(e) => setValue(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-900">
            {value ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      );
    }

    if (typeof setting.value === 'number') {
      return (
        <input
          type="number"
          value={value as number}
          onChange={(e) => setValue(Number(e.target.value))}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
        />
      );
    }

    return (
      <input
        type="text"
        value={value as string}
        onChange={(e) => setValue(e.target.value)}
        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
      />
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="h-5 w-5" />;
      case 'notifications': return <Bell className="h-5 w-5" />;
      case 'integrations': return <Globe className="h-5 w-5" />;
      default: return <SettingsIcon className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'security': return 'bg-red-100 text-red-600';
      case 'notifications': return 'bg-blue-100 text-blue-600';
      case 'integrations': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getCategoryColor(setting.category)}`}>
            {getCategoryIcon(setting.category)}
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{setting.key}</h3>
            <p className="text-sm text-gray-500">{setting.description}</p>
          </div>
        </div>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
          setting.category === 'security' ? 'bg-red-100 text-red-800' :
          setting.category === 'notifications' ? 'bg-blue-100 text-blue-800' :
          setting.category === 'integrations' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {setting.category}
        </span>
      </div>

      <div className="mt-4">
        {isEditing ? (
          <div className="space-y-4">
            {renderInput()}
            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-900">
              <strong>Current value:</strong> {String(setting.value)}
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Last updated: {new Date(setting.updatedAt).toLocaleString()}</span>
          <span>by {setting.updatedBy}</span>
        </div>
      </div>
    </div>
  );
};

export const AdminSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [saving, setSaving] = useState(false);

  const categories = [
    { id: 'all', name: 'All Settings', icon: SettingsIcon },
    { id: 'general', name: 'General', icon: SettingsIcon },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'integrations', name: 'Integrations', icon: Globe },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await adminApiService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (id: string, value: any) => {
    setSaving(true);
    try {
      await adminApiService.updateSetting(id, value, 'admin@example.com');
      setSettings(prev => 
        prev.map(setting => 
          setting.id === id 
            ? { ...setting, value, updatedAt: new Date(), updatedBy: 'admin@example.com' }
            : setting
        )
      );
    } catch (error) {
      console.error('Error updating setting:', error);
    } finally {
      setSaving(false);
    }
  };

  const filteredSettings = selectedCategory === 'all' 
    ? settings 
    : settings.filter(setting => setting.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý cài đặt hệ thống và cấu hình ứng dụng
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchSettings}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  selectedCategory === category.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <category.icon className="h-4 w-4" />
                <span>{category.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {filteredSettings.map((setting) => (
          <SettingCard
            key={setting.id}
            setting={setting}
            onUpdate={handleUpdateSetting}
          />
        ))}
      </div>

      {filteredSettings.length === 0 && (
        <div className="text-center py-12">
          <Database className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No settings found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No settings available for the selected category.
          </p>
        </div>
      )}

      {/* Saving Indicator */}
      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          <span>Saving changes...</span>
        </div>
      )}
    </div>
  );
}; 