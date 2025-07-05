import React from 'react';
import { Share2, Users, Home, DollarSign, LogOut, Lightbulb, Video } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  connectedCount: number;
  totalPosts: number;
}

export const Header: React.FC<HeaderProps> = ({ connectedCount }) => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
      logout();
      setTimeout(() => {
        window.location.href = '/';
      }, 300);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {/* Logo - Clickable to home */}
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="bg-white rounded-lg">
                <img
                  src="/assets/autopost.png"
                  alt="Hoàng Mai Mobile"
                  className="w-10 h-10 object-cover rounded shadow-md"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Social Hub</h1>
                <p className="text-xs text-gray-500">Lập lịch đăng bài tự động</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-4 ml-10">
              <Link
                to="/"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                  isActive('/') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Home size={16} />
                Trang Chủ
              </Link>

              <Link
                to="/solution"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                  isActive('/solution') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Lightbulb size={16} />
                Giải Pháp
              </Link>

              <Link
                to="/pricing"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                  isActive('/pricing') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <DollarSign size={16} />
                Bảng Giá
              </Link>

              <Link
                to="/video"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                  isActive('/video') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Video size={16} />
                Tạo Video
              </Link>
              
              {/* Authenticated-only navigation */}
              {isAuthenticated && (
                <>
                  <Link
                    to="/posts"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                      isActive('/posts') 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Share2 size={16} />
                    Đăng Bài
                  </Link>
                  
                  <Link
                    to="/accounts"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                      isActive('/accounts') 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Users size={16} />
                    Cấu Hình
                    {/* {connectedCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {connectedCount}
                      </span>
                    )} */}
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Right side - Stats & Actions */}
          <div className="flex items-center space-x-4">
            {/* Stats - Hidden on mobile, only show when authenticated */}
            {/* {isAuthenticated && (
              <div className="hidden lg:flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{connectedCount}</div>
                  <div className="text-xs text-gray-500">Connected</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{totalPosts}</div>
                  <div className="text-xs text-gray-500">Posts</div>
                </div>
              </div>
            )} */}

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {isAuthenticated ? (
                <>
                  {/* User Profile Section */}
                  <div className="flex items-center gap-3">
                    {/* User Avatar & Info */}
                    <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{user?.full_name}</div>
                        <div className="text-xs text-gray-500">{user?.email}</div>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {user?.full_name?.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    {/* Mobile Avatar Only */}
                    <div className="sm:hidden w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {user?.full_name?.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Logout Button */}
                    <button 
                      onClick={handleLogout}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                      title="Đăng xuất"
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Login/Register buttons for non-authenticated users */}
                  <Link
                    to="/login"
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors font-medium rounded-lg hover:bg-gray-100"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center space-x-2">
            <Link
              to="/"
              className={`p-2 rounded-lg transition-colors ${
                isActive('/') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Home size={20} />
            </Link>

            <Link
              to="/solution"
              className={`p-2 rounded-lg transition-colors ${
                isActive('/solution') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Lightbulb size={20} />
            </Link>

            <Link
              to="/video"
              className={`p-2 rounded-lg transition-colors ${
                isActive('/video') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Video size={20} />
            </Link>

            <Link
              to="/pricing"
              className={`p-2 rounded-lg transition-colors ${
                isActive('/pricing') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <DollarSign size={20} />
            </Link>

            {/* Authenticated-only mobile navigation */}
            {isAuthenticated && (
              <>
                <Link
                  to="/posts"
                  className={`p-2 rounded-lg transition-colors ${
                    isActive('/posts') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Share2 size={20} />
                </Link>
                
                <Link
                  to="/accounts"
                  className={`p-2 rounded-lg transition-colors relative ${
                    isActive('/accounts') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Users size={20} />
                  {connectedCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {connectedCount}
                    </span>
                  )}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};