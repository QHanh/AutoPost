import React, { createContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string; }>;
  register: (email: string, password: string, full_name: string) => Promise<{ success: boolean; message: string; }>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const VITE_API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // You might want to verify the token with your backend here
      // For now, we'll just fetch user info if a token exists.
      fetch(`${VITE_API_URL}/api/v1/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.id) {
            setUser(data);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    const response = await fetch(`${VITE_API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username, password }),
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem('token', data.access_token);
      // After successful login, fetch user data
      const userResponse = await fetch(`${VITE_API_URL}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const userData = await userResponse.json();
      if(userResponse.ok) {
        setUser(userData);
      }
      return { success: true, message: 'Đăng nhập thành công!' };
    }
    return { success: false, message: data.detail || 'Đăng nhập thất bại.' };
  };

  const register = async (email: string, password: string, full_name: string) => {
    const response = await fetch(`${VITE_API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name }),
    });

    const data = await response.json();
    if (response.ok) {
      return { success: true, message: 'Đăng ký thành công! Vui lòng đăng nhập.' };
    }
    return { success: false, message: data.detail || 'Đăng ký thất bại.' };
  };


  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      register,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 