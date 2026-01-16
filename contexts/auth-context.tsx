'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthService } from '@/lib/auth-service';
import { chatService } from '@/lib/chat-service';
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

  // Helper to connect WebSocket if token exists
  const connectSocket = useCallback((token: string) => {
    chatService.connect(token);
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = AuthService.getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await AuthService.getCurrentUser();
        setUser(userData);
        connectSocket(token);
      } catch {
        // Token invalid or expired, try refresh
        try {
          const newToken = await AuthService.refreshToken();
          const userData = await AuthService.getCurrentUser();
          setUser(userData);
          connectSocket(newToken);
        } catch {
          await AuthService.logout();
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [connectSocket]);

  const login = useCallback(async (credentials: LoginRequest) => {
    const result = await AuthService.login(credentials);
    setUser(result.user);
    connectSocket(result.accessToken);
  }, [connectSocket]);

  const register = useCallback(async (data: RegisterRequest) => {
    const result = await AuthService.register(data);
    setUser(result.user);
    connectSocket(result.accessToken);
  }, [connectSocket]);

  const logout = useCallback(async () => {
    await AuthService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      isAuthenticated: !!user
    }}>
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
