import React from 'react';
import { Share2, Users, Home, DollarSign, LogOut, Lightbulb, Video, Menu, X, Smartphone, Building2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import Swal from 'sweetalert2';

interface HeaderProps {
  connectedCount: number;
  totalPosts: number;
}

export const Header: React.FC<HeaderProps> = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const isActive = (path: string) => location.pathname.startsWith(path);
  
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

  React.useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const navLinks = (
    <>
      <Link to="/" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
        <Home size={16} /> Trang Chủ
      </Link>
      <Link to="/solution" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/solution') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
        <Lightbulb size={16} /> Giải Pháp
      </Link>
      <Link to="/pricing" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/pricing') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
        <DollarSign size={16} /> Bảng Giá
      </Link>
      {isAuthenticated && (
        <>
          <div className="hidden lg:flex items-center space-x-2">
            <Link to="/video" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/video') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Video size={16} /> Tạo Video
            </Link>
            <Link to="/posts" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/posts') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Users size={16} /> Đăng Bài
            </Link>
            <Link to="/accounts" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/accounts') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Building2 size={16} /> Cấu Hình
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-2">
            <Link to="/services" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/services') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Smartphone size={16} /> Dịch vụ
            </Link>
            <Link to="/chatbot-tabs" className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/chatbot-tabs') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Users size={16} /> Quản lý thiết bị
            </Link>
          </div>
        </>
      )}
    </>
  );

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <img src="/assets/autopost.png" alt="Logo" className="w-10 h-10 object-cover rounded shadow-md"/>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Social Hub</h1>
                <p className="text-xs text-gray-500">Lập lịch đăng bài tự động</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex flex-grow items-center justify-center space-x-2 lg:space-x-4">
            {navLinks}
          </nav>

          {/* User Info & Actions */}
          <div className="flex items-center flex-shrink-0">
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-4 ml-4">
                {/* User Avatar & Name */}
                <div className="relative group">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md">
                    {user?.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-20 hidden group-hover:block">
                      <div className="py-1">
                        <p className="text-sm text-gray-700">{user?.email}</p>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-100 hover:text-red-700 flex items-center gap-2">
                          <LogOut size={16}/> Đăng xuất
                        </button>
                      </div>
                  </div>
                </div>
                 <button onClick={handleLogout} className="p-2 rounded-md text-gray-700 hover:bg-gray-100">
                   <LogOut size={20} />
                 </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2 ml-6">
                <Link to="/login" className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100">Đăng nhập</Link>
                <Link to="/register" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium">Đăng ký</Link>
              </div>
            )}
            <div className="md:hidden ml-4">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-700">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <nav className="flex flex-col space-y-1">
            {navLinks}
            {isAuthenticated && (
              <>
                <div className="border-t border-gray-200 my-2"></div>
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-gray-600 hover:bg-red-100 hover:text-red-700 rounded-lg flex items-center gap-2">
                  <LogOut size={16}/> Đăng xuất
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
