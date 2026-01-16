'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    // Check if user is logged in on mount
    const initAuth = async () => {
      const token = AuthService.getAccessToken();
      
      if (token) {
        try {
          // Check if token is still valid by fetching user
          const userData = await AuthService.getCurrentUser();
          setUser(userData);
          
          // Connect with existing token
          chatService.connect(token);
        } catch (error) {
          // Token expired, try to refresh
          try {
            const newToken = await AuthService.refreshToken();
            const userData = await AuthService.getCurrentUser();
            setUser(userData);
            chatService.connect(newToken);
          } catch {
            // Refresh failed, logout
            await AuthService.logout();
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    const result = await AuthService.login(credentials);
    setUser(result.user);
    
    // Connect WebSocket with token
    chatService.connect(result.accessToken);
  };  

  const register = async (data: RegisterRequest) => {
    const result = await AuthService.register(data);
    setUser(result.user);
    
    // Connect WebSocket with token
    chatService.connect(result.accessToken);
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
