import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  full_name: string;
  token: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_BASE_URL;
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setAuthState({
          user: { ...user, token },
          isAuthenticated: true,
          isLoading: false
        });
      } catch (error) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    } else {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  }, []);

  const sendVerificationCode = async (email: string) => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/v1/registration/send-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() })
      });

      if (response.status === 204) {
        return { success: true, message: 'Mã xác thực đã được gửi đến email của bạn.' };
      } else {
        const data = await response.json();
        return { success: false, message: data.detail || 'Không thể gửi mã xác thực. Vui lòng thử lại.' };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và đảm bảo server đang hoạt động.` 
      };
    }
  };

  const register = async (email: string, password: string, full_name: string, verificationCode: string) => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const plansResponse = await fetch(`${apiBaseUrl}/api/v1/subscriptions/plans`);
      if (!plansResponse.ok) {
        throw new Error('Failed to fetch subscription plans.');
      }
      const plans = await plansResponse.json();

      const freePlan = plans.find((plan: any) => plan.name.toLowerCase() === 'miễn phí');
      if (!freePlan) {
        throw new Error('"miễn phí" subscription plan not found.');
      }

      const response = await fetch(`${apiBaseUrl}/api/v1/registration/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          full_name: full_name.trim(),
          subscription_id: freePlan.id,
          verification_code: verificationCode
        })
      });

      const data = await response.json();

      if (response.status === 201) {
        return { success: true, message: 'Đăng ký thành công! Vui lòng đăng nhập.' };
      } else {
        return { 
          success: false, 
          message: data.detail || `Lỗi server (${response.status}). Vui lòng thử lại sau.` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và đảm bảo server đang hoạt động.` 
      };
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.status === 200) {
        const user: User = {
          id: data.user?.id || data.id || 'user_id',
          email: username,
          full_name: data.user?.full_name || data.full_name || 'User',
          token: data.access_token || data.token || 'auth_token',
          role: data.role 
        };

        localStorage.setItem('auth_token', user.token);
        localStorage.setItem('user_data', JSON.stringify({
          id: user.id,
          email: user.email,
          full_name: user.full_name, 
          role: user.role
        }));

        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        });

        return { success: true, message: 'Đăng nhập thành công!' };
      } else {
        return { success: false, message: 'Sai tên đăng nhập hoặc mật khẩu.' };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và đảm bảo server đang hoạt động.` 
      };
    }
  };

  const saveToken = async (token: string) => {
    localStorage.setItem('auth_token', token);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/v1/users/me`,
       {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();

      const user: User = {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        token: token,
        role: userData.role
      };

      localStorage.setItem('user_data', JSON.stringify({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      }));

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false
      });

    } catch (error) {
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  const forgotPassword = async (email: string) => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/v1/users/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() })
      });

      if (response.status === 204) {
        return { success: true, message: 'Nếu email của bạn tồn tại trong hệ thống, chúng tôi đã gửi một mã khôi phục.' };
      } else {
        const data = await response.json();
        return { success: false, message: data.detail || 'Không thể gửi yêu cầu. Vui lòng thử lại.' };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Không thể kết nối đến server.` 
      };
    }
  };

  const resetPassword = async (email: string, code: string, new_password: string) => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/v1/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), code, new_password })
      });

      if (response.status === 204) {
        return { success: true, message: 'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập.' };
      } else {
        const data = await response.json();
        return { success: false, message: data.detail || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.' };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Không thể kết nối đến server.` 
      };
    }
  };

  return {
    ...authState,
    register,
    sendVerificationCode,
    login,
    logout,
    saveToken,
    forgotPassword,
    resetPassword
  };
};