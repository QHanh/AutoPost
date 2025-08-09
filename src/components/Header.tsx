import React from 'react';
import { Share2, Users, Home, DollarSign, LogOut, Lightbulb, Video, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Swal from 'sweetalert2';
import autopostLogo from '../assets/autopost.png';

interface HeaderProps {
  connectedCount: number;
  totalPosts: number;
}

export const Header: React.FC<HeaderProps> = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  // State để quản lý việc mở/đóng menu trên di động
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // Hàm kiểm tra link có đang active hay không
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Hàm xử lý đăng xuất
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

  // Đóng menu khi chuyển trang
  React.useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navLinks = (
    <>
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
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="bg-white rounded-lg">
                <img
                  src={autopostLogo}
                  alt="Hoàng Mai Mobile"
                  className="w-10 h-10 object-cover rounded shadow-md"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AutoPost</h1>
                <p className="text-xs text-gray-500">Lập lịch đăng bài tự động</p>
              </div>
            </Link>
          </div>

          {/* Navigation cho màn hình lớn */}
          <nav className="hidden md:flex items-center space-x-4">
            {navLinks}
          </nav>

          {/* User Actions và Nút Menu cho di động */}
          <div className="flex items-center">
            {/* User Profile / Login Buttons */}
            <div className="hidden md:flex items-center">
              {isAuthenticated ? (
                <div className="flex items-center gap-4 ml-6">
                  <div className="flex flex-col items-center">
                    <div className="relative group">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md cursor-pointer">
                        {user?.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute top-1/2 -translate-y-1/2 left-full ml-3 hidden group-hover:block w-max bg-gray-800 text-white text-xs rounded py-1 px-2 pointer-events-none">
                        {user?.email}
                        <div className="absolute top-1/2 -translate-y-1/2 right-full w-0 h-0 border-y-4 border-y-transparent border-r-4 border-r-gray-800"></div>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-gray-700 mt-1 max-w-[70px] truncate" title={user?.full_name}>
                      {user?.full_name}
                    </div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2.5 text-gray-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-100"
                    title="Đăng xuất"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 ml-6">
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
                </div>
              )}
            </div>

            {/* Nút menu cho di động */}
            <div className="md:hidden ml-4">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Mở menu chính</span>
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menu thả xuống cho di động */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <nav className="flex flex-col space-y-2">
              {navLinks}
            </nav>
            {/* User actions trong menu di động */}
            <div className="pt-4 pb-3 border-t border-gray-200">
              {isAuthenticated ? (
                <div className="flex items-center px-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user?.full_name}</div>
                    <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-auto p-2 text-gray-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-100"
                    title="Đăng xuất"
                  >
                    <LogOut size={22} />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2 px-2">
                  <Link
                    to="/login"
                    className="block w-full text-left px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors font-medium rounded-lg hover:bg-gray-100"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="block w-full text-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
