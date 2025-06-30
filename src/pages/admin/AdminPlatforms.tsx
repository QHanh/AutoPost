import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle,
  XCircle,
  Globe,
  Users,
  Activity
} from 'lucide-react';
import { Platform } from '../../types/platform.js';
import { adminApiService } from '../../services/adminApiService.js';

// Mock platform data
const mockPlatforms: Platform[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    gradient: 'from-blue-500 to-blue-600',
    icon: '📘',
    connected: true,
    accessToken: 'mock_token_123',
    lastPost: '2024-01-15T10:30:00Z',
    followers: 1250,
    supportedFormats: {
      images: ['jpg', 'png', 'gif'],
      videos: ['mp4', 'mov'],
      maxImageSize: 4,
      maxVideoSize: 100,
      maxVideoDuration: 240
    }
  },
  {
    id: 'twitter',
    name: 'Twitter',
    color: '#1DA1F2',
    gradient: 'from-blue-400 to-blue-500',
    icon: '🐦',
    connected: true,
    accessToken: 'mock_token_456',
    lastPost: '2024-01-15T09:15:00Z',
    followers: 890,
    supportedFormats: {
      images: ['jpg', 'png', 'gif'],
      videos: ['mp4'],
      maxImageSize: 5,
      maxVideoSize: 512,
      maxVideoDuration: 140
    }
  },
  {
    id: 'instagram',
    name: 'Instagram',
    color: '#E4405F',
    gradient: 'from-pink-500 to-purple-500',
    icon: '📷',
    connected: false,
    supportedFormats: {
      images: ['jpg', 'png'],
      videos: ['mp4'],
      maxImageSize: 8,
      maxVideoSize: 100,
      maxVideoDuration: 60
    }
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    gradient: 'from-blue-600 to-blue-700',
    icon: '💼',
    connected: false,
    supportedFormats: {
      images: ['jpg', 'png'],
      videos: ['mp4'],
      maxImageSize: 5,
      maxVideoSize: 200,
      maxVideoDuration: 600
    }
  }
];

const PlatformCard: React.FC<{
  platform: Platform;
  onEdit: (platform: Platform) => void;
  onDelete: (id: string) => void;
  onView: (platform: Platform) => void;
  onToggleConnection: (id: string) => void;
}> = ({ platform, onEdit, onDelete, onView, onToggleConnection }) => {
  const getStatusColor = (connected: boolean) => {
    return connected ? 'text-green-600' : 'text-gray-400';
  };

  const getStatusIcon = (connected: boolean) => {
    return connected ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />;
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className={`h-2 ${platform.gradient}`} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{platform.icon}</div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{platform.name}</h3>
              <div className="flex items-center space-x-2">
                {getStatusIcon(platform.connected)}
                <span className={`text-sm font-medium ${getStatusColor(platform.connected)}`}>
                  {platform.connected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onView(platform)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEdit(platform)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(platform.id)}
              className="p-2 text-red-400 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {platform.connected && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Followers</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {platform.followers?.toLocaleString() || 'N/A'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Last Post</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {platform.lastPost ? new Date(platform.lastPost).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Supported Formats</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Images:</span>
              <span className="ml-1 text-gray-900">
                {platform.supportedFormats?.images.join(', ')}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Videos:</span>
              <span className="ml-1 text-gray-900">
                {platform.supportedFormats?.videos.join(', ')}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => onToggleConnection(platform.id)}
            className={`w-full px-4 py-2 text-sm font-medium rounded-md ${
              platform.connected
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {platform.connected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PlatformModal: React.FC<{
  platform: Platform | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (platform: Partial<Platform>) => void;
  mode: 'view' | 'edit' | 'add';
}> = ({ platform, isOpen, onClose, onSave, mode }) => {
  const [formData, setFormData] = useState<Partial<Platform>>({});

  useEffect(() => {
    if (platform) {
      setFormData(platform);
    } else if (mode === 'add') {
      setFormData({
        id: '',
        name: '',
        color: '#000000',
        gradient: 'from-gray-500 to-gray-600',
        icon: '🌐',
        connected: false,
        supportedFormats: {
          images: [],
          videos: [],
          maxImageSize: 5,
          maxVideoSize: 100,
          maxVideoDuration: 60
        }
      });
    }
  }, [platform, mode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {mode === 'view' ? 'Platform Details' : mode === 'edit' ? 'Edit Platform' : 'Add Platform'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          {mode === 'view' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{platform?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1 text-sm text-gray-900">
                  {platform?.connected ? 'Connected' : 'Not Connected'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Followers</label>
                <p className="mt-1 text-sm text-gray-900">
                  {platform?.followers?.toLocaleString() || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Post</label>
                <p className="mt-1 text-sm text-gray-900">
                  {platform?.lastPost ? new Date(platform.lastPost).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => {
              e.preventDefault();
              onSave(formData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Platform ID</label>
                  <input
                    type="text"
                    value={formData.id || ''}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    disabled={mode === 'edit'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Icon</label>
                  <input
                    type="text"
                    value={formData.icon || ''}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Color</label>
                  <input
                    type="color"
                    value={formData.color || '#000000'}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gradient</label>
                  <select
                    value={formData.gradient || ''}
                    onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="from-blue-500 to-blue-600">Blue</option>
                    <option value="from-green-500 to-green-600">Green</option>
                    <option value="from-red-500 to-red-600">Red</option>
                    <option value="from-purple-500 to-purple-600">Purple</option>
                    <option value="from-yellow-500 to-yellow-600">Yellow</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {mode === 'add' ? 'Add Platform' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export const AdminPlatforms: React.FC = () => {
  const [platforms, setPlatforms] = useState<Platform[]>(mockPlatforms);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'add'>('view');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchPlatforms = async () => {
      const response = await adminApiService.getPlatforms();
      setPlatforms(Array.isArray(response) ? response : []);
    };
    fetchPlatforms();
  }, []);

  const handleEdit = (platform: Platform) => {
    setSelectedPlatform(platform);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleView = (platform: Platform) => {
    setSelectedPlatform(platform);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this platform?')) {
      setPlatforms(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleToggleConnection = (id: string) => {
    setPlatforms(prev => 
      prev.map(p => 
        p.id === id ? { ...p, connected: !p.connected } : p
      )
    );
  };

  const handleAddPlatform = () => {
    setSelectedPlatform(null);
    setModalMode('add');
    setModalOpen(true);
  };

  const handleSave = (platformData: Partial<Platform>) => {
    if (modalMode === 'add') {
      const newPlatform: Platform = {
        ...platformData as Platform,
        id: platformData.id || `platform_${Date.now()}`,
        connected: false
      };
      setPlatforms(prev => [...prev, newPlatform]);
    } else if (selectedPlatform) {
      setPlatforms(prev => 
        prev.map(p => 
          p.id === selectedPlatform.id ? { ...p, ...platformData } : p
        )
      );
    }
    setModalOpen(false);
  };

  const filteredPlatforms = filter === 'all' 
    ? platforms 
    : platforms.filter(p => 
        filter === 'connected' ? p.connected : !p.connected
      );

  const connectedCount = platforms.filter(p => p.connected).length;
  const totalCount = platforms.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý các nền tảng mạng xã hội và cấu hình tích hợp
          </p>
        </div>
        <button
          onClick={handleAddPlatform}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Platform
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Globe className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Platforms</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Connected</dt>
                  <dd className="text-lg font-medium text-gray-900">{connectedCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Disconnected</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalCount - connectedCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by status:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Platforms</option>
            <option value="connected">Connected</option>
            <option value="disconnected">Disconnected</option>
          </select>
        </div>
      </div>

      {/* Platforms Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPlatforms.map((platform) => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            onToggleConnection={handleToggleConnection}
          />
        ))}
      </div>

      {filteredPlatforms.length === 0 && (
        <div className="text-center py-12">
          <Globe className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No platforms found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? 'Get started by adding a new platform.' 
              : `No ${filter} platforms available.`}
          </p>
          {filter === 'all' && (
            <div className="mt-6">
              <button
                onClick={handleAddPlatform}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Platform
              </button>
            </div>
          )}
        </div>
      )}

      {/* Platform Modal */}
      <PlatformModal
        platform={selectedPlatform}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        mode={modalMode}
      />
    </div>
  );
}; 