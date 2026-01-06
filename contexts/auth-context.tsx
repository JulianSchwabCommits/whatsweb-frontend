'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '@/lib/auth-service';
import type { User, LoginRequest, RegisterRequest } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to restore session from httpOnly cookie on mount
    const initAuth = async () => {
      try {
        // Try to refresh token using httpOnly cookie
        // This will work if user has a valid refresh token cookie
        await AuthService.refreshToken();
        const userData = await AuthService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        // No valid session - user needs to login
        console.log('No active session');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    const result = await AuthService.login(credentials);
    setUser(result.user);
  };

  const register = async (data: RegisterRequest) => {
    const result = await AuthService.register(data);
    setUser(result.user);
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
