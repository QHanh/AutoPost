import React, { useContext } from 'react';
import { AuthContext, User } from '../contexts/AuthContext';

export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string; }>;
  register: (email: string, password: string, full_name: string) => Promise<{ success: boolean; message: string; }>;
  logout: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  const token = localStorage.getItem('token');
  return { ...context, token };
}; 