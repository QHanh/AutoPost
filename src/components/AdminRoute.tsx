import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { isAdminUser } from '../utils/adminUtils.js';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Hiển thị loading khi đang kiểm tra authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Nếu chưa đăng nhập, chuyển hướng đến trang login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra role admin
  const userRole = user?.role || 'user';
  
  if (!isAdminUser(user)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không có quyền truy cập</h3>
          <p className="text-gray-500 mb-6">
            Bạn cần quyền Administrator để truy cập trang này.
            <br />
            <span className="text-sm">Current role: {userRole}</span>
          </p>
          <div className="space-x-3">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Quay lại
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Nếu có quyền admin, hiển thị nội dung
  return <>{children}</>;
}; 