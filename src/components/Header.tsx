import React from 'react';
import { Share2, Users, Home, DollarSign, LogOut, Lightbulb, Video } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Swal from 'sweetalert2';

interface HeaderProps {
  connectedCount: number;
  totalPosts: number;
}

export const Header: React.FC<HeaderProps> = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    const { isConfirmed } = await Swal.fire({
      title: 'Đăng xuất?',
      text: 'Bạn có chắc chắn muốn đăng xuất?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đăng xuất',
      cancelButtonText: 'Hủy'
    });
  
    if (isConfirmed) {
      logout();
      setTimeout(() => (window.location.href = '/'), 300);
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
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
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

            {/* <Link
              to="/video"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                isActive('/video')
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Video size={16} />
              Tạo Video
            </Link> */}

            {/* Authenticated-only navigation */}
            {isAuthenticated && (
              <>
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

                {/* User Profile Section */}
                <div className="flex items-end gap-1 pl-4">
                  <div className="flex flex-col items-center">
                    <div className="relative group">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md cursor-pointer">
                        {user?.full_name?.charAt(0).toUpperCase()}
                      </div>
                      {/* Tooltip with email */}
                      <div className="absolute top-1/2 -translate-y-1/2 left-full ml-3 hidden group-hover:block w-max bg-gray-800 text-white text-xs rounded py-1 px-2 pointer-events-none">
                        {user?.email}
                        {/* Tooltip arrow */}
                        <div className="absolute top-1/2 -translate-y-1/2 right-full w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-gray-800"></div>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-gray-700 mt-1 max-w-[70px] truncate" title={user?.full_name}>
                      {user?.full_name}
                    </div>
                  </div>
                  
                  {/* Logout Button */}
                  <button 
                    onClick={handleLogout}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                    title="Đăng xuất"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              </>
            )}
          </nav>

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
              {!isAuthenticated && (
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
        </div>
      </div>
    </header>
  );
};