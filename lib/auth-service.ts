// Authentication service for API calls
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  User,
} from '@/types/auth';


let accessTokenMemory: string | null = null;
let userMemory: User | null = null;

export class AuthService {
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
    // Refresh token is sent via httpOnly cookie automatically
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Send httpOnly cookie with refresh token
    });

    if (!response.ok) {
      // Clear in-memory state on refresh failure
      accessTokenMemory = null;
      userMemory = null;
      throw new Error('Session expired or invalid');
    }

    const { accessToken } = await response.json();
    accessTokenMemory = accessToken;
    return accessToken;
  }

  static async getCurrentUser(): Promise<User> {
    const response = await this.fetchWithAuth(`${this.baseUrl}/auth/me`);
    const user = await response.json();
    userMemory = user;
    return user;
  }

  static async logout(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Include cookies to invalidate refresh token
        headers: accessTokenMemory ? {
          'Authorization': `Bearer ${accessTokenMemory}`,
        } : {},
      });
    } finally {
      // Clear in-memory tokens
      accessTokenMemory = null;
      userMemory = null;
    }
  }

  static isAuthenticated(): boolean {
    return !!accessTokenMemory;
  }

  static getUser(): User | null {
    return userMemory;
  }

  static getAccessToken(): string | null {
    return accessTokenMemory;
  }

  private static setTokens(data: AuthResponse): void {
    accessTokenMemory = data.accessToken;
    userMemory = data.user;
  }

  private static async fetchWithAuth(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    let response = await fetch(url, {
      ...options,
      credentials: 'include', // Include cookies
      headers: {
        ...options.headers,
        ...(accessTokenMemory ? { 'Authorization': `Bearer ${accessTokenMemory}` } : {}),
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
