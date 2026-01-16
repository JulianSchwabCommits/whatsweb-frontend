// Authentication service for API calls
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  User,
} from '@/types/auth';

// localStorage keys
const TOKEN_KEY = 'access_token';
const USER_KEY = 'user_data';

export class AuthService {
  // Get token from localStorage
  private static getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  // Get user from localStorage
  private static getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem(USER_KEY);
    try {
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  // Save token to localStorage
  private static saveToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  }

  // Save user to localStorage
  private static saveUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // Clear localStorage
  private static clearStorage(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private static get baseUrl(): string {
    const url = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!url) {
      throw new Error('NEXT_PUBLIC_BACKEND_URL is not defined');
    }
    return url;
  }

  static async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    this.setTokens(result);
    return result;
  }

  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies for httpOnly refresh token
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    this.setTokens(result);
    return result;
  }

  static async refreshToken(): Promise<string> {
    // Refresh token is now sent via httpOnly cookie automatically
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Send httpOnly cookie with refresh token
    });

    if (!response.ok) {
      // Don't call logout here - just throw error
      // The caller will handle it appropriately
      throw new Error('Session expired');
    }

    const { accessToken } = await response.json();
    this.saveToken(accessToken);
    return accessToken;
  }

  static async getCurrentUser(): Promise<User> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/auth/me`);
    const user = await response.json();
    this.saveUser(user);
    return user;
  }

  static async logout(): Promise<void> {
    try {
      // 1. Disconnect WebSocket FIRST
      const { chatService } = await import('./chat-service');
      chatService.disconnect();
      
      // 2. Then call logout API
      const token = this.getStoredToken();
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? {
          'Authorization': `Bearer ${token}`,
        } : {},
      });
    } finally {
      // 3. Clear local storage
      this.clearStorage();
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }

  static getUser(): User | null {
    return this.getStoredUser();
  }

  static getAccessToken(): string | null {
    return this.getStoredToken();
  }

  private static setTokens(data: AuthResponse): void {
    this.saveToken(data.accessToken);
    this.saveUser(data.user);
  }

  private static async fetchWithAuth(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = this.getStoredToken();
    let response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (response.status === 401) {
      const newToken = await this.refreshToken();
      response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
        },
      });
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response;
  }
}
