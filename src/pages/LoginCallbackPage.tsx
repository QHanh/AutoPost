import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const LoginCallbackPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { saveToken } = useAuth();
  const handledRef = useRef(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return; // Prevent double-invocation in StrictMode
    handledRef.current = true;

    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    const handleLogin = async (authToken: string) => {
      await saveToken(authToken);
      // Đảm bảo chỉ redirect 1 lần
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      // Reload toàn bộ trang để đảm bảo Header và tất cả components cập nhật
      window.location.href = '/accounts';
    };

    if (token) {
      handleLogin(token);
    } else {
      navigate('/login', { replace: true });
    }
  }, [location, navigate, saveToken]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-xl font-semibold text-gray-700">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
};
