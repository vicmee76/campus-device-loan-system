'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { deviceService } from '@/lib/api/device-service';
import { User, ApiResponse } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  isStaff: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = Cookies.get('token');
    if (storedToken) {
      setToken(storedToken);
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response: ApiResponse<User> = await deviceService.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        // Token might be invalid, clear it
        Cookies.remove('token');
        setToken(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      Cookies.remove('token');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response: ApiResponse<{ token: string; user: User }> = await deviceService.login(email, password);
    if (response.success && response.data) {
      const { token: newToken, user: newUser } = response.data;
      Cookies.set('token', newToken, { expires: 7 }); // 7 days
      setToken(newToken);
      setUser(newUser);
    } else {
      throw new Error(response.message || 'Login failed');
    }
  };

  const logout = () => {
    Cookies.remove('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading,
        isAuthenticated: !!user && !!token,
        isStaff: user?.role === 'staff',
        isStudent: user?.role === 'student',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


