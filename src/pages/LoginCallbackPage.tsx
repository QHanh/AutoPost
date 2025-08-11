import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const LoginCallbackPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { saveToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    const handleLogin = async (authToken: string) => {
      await saveToken(authToken);
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
