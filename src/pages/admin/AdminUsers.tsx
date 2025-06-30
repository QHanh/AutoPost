import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  UserPlus,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { adminApiService } from '../../services/adminApiService.js';
import { AdminUser, AdminFilter, AdminPagination } from '../../types/admin.js';

const UserRow: React.FC<{
  user: AdminUser;
  onEdit: (user: AdminUser) => void;
  onDelete: (id: string) => void;
  onView: (user: AdminUser) => void;
}> = ({ user, onEdit, onDelete, onView }) => {
  const [showActions, setShowActions] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'user': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            {user.avatar ? (
              <img className="h-10 w-10 rounded-full" src={user.avatar} alt="" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {user.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
          {user.role}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
          {user.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {user.totalPosts}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {user.connectedAccounts}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-gray-400 hover:text-gray-600"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {showActions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
              <div className="py-1">
                <button
                  onClick={() => {
                    onView(user);
                    setShowActions(false);
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </button>
                <button
                  onClick={() => {
                    onEdit(user);
                    setShowActions(false);
                  }}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(user.id);
                    setShowActions(false);
                  }}
                  className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

const UserModal: React.FC<{
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Partial<AdminUser>) => void;
  mode: 'view' | 'edit';
}> = ({ user, isOpen, onClose, onSave, mode }) => {
  const [formData, setFormData] = useState<Partial<AdminUser>>({});

  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {mode === 'view' ? 'User Details' : 'Edit User'}
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
                <p className="mt-1 text-sm text-gray-900">{user.fullName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="mt-1 text-sm text-gray-900">{user.role}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1 text-sm text-gray-900">{user.status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Posts</label>
                <p className="mt-1 text-sm text-gray-900">{user.totalPosts}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Connected Accounts</label>
                <p className="mt-1 text-sm text-gray-900">{user.connectedAccounts}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => {
              e.preventDefault();
              onSave(formData);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName || ''}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={formData.role || ''}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status || ''}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
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
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<AdminPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filter, setFilter] = useState<AdminFilter>({});
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await adminApiService.getUsers(filter, pagination);
      const users = result?.users || [];
      const paginationData = result?.pagination || {};
      setUsers(users);
      setPagination(paginationData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleView = (user: AdminUser) => {
    setSelectedUser(user);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminApiService.deleteUser(id);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleSave = async (userData: Partial<AdminUser>) => {
    if (!selectedUser) return;
    
    try {
      await adminApiService.updateUser(selectedUser.id, userData);
      setModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý người dùng và phân quyền trong hệ thống
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <div className="mt-1 relative">
              <input
                type="text"
                placeholder="Search users..."
                value={filter.search || ''}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              value={filter.role || ''}
              onChange={(e) => setFilter({ ...filter, role: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filter.status || ''}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Users ({pagination.total})</h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accounts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                  />
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{pagination.total}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={pagination.page === pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Modal */}
      <UserModal
        user={selectedUser}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        mode={modalMode}
      />
    </div>
  );
}; 