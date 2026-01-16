import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  User,
} from '@/types/auth';

// Keys for localStorage
const TOKEN_KEY = 'access_token';
const USER_KEY = 'user_data';

const isBrowser = typeof window !== 'undefined';

export class AuthService {
  // storage helpers

  private static getItem<T>(key: string): T | null {
    if (!isBrowser) return null;
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  private static setItem(key: string, value: unknown) {
    if (!isBrowser) return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  private static removeItem(key: string) {
    if (!isBrowser) return;
    localStorage.removeItem(key);
  }

  // base url

  private static get baseUrl(): string {
    const url = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!url) throw new Error('NEXT_PUBLIC_BACKEND_URL is not defined');
    return url;
  }

  // public api

  static async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.authRequest('/auth/register', data);
  }

  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.authRequest('/auth/login', credentials);
  }

  static async refreshToken(): Promise<string> {
    const res = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      throw new Error('Session expired');
    }

    const { accessToken } = await res.json();
    this.setAccessToken(accessToken);
    return accessToken;
  }

  static async getCurrentUser(): Promise<User> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/auth/me`);
    const user = await res.json();
    this.setUser(user);
    return user;
  }

  static async logout(): Promise<void> {
    try {
      // Disconnect WS first (correct order)
      const { chatService } = await import('./chat-service');
      chatService.disconnect();

      const token = this.getAccessToken();
      await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } finally {
      this.clearStorage();
    }
  }

  static isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  static getUser(): User | null {
    return this.getItem<User>(USER_KEY);
  }

  static getAccessToken(): string | null {
    return this.getItem<string>(TOKEN_KEY);
  }

  // internal helpers

  private static async authRequest(
    path: string,
    body: unknown
  ): Promise<AuthResponse> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message);
    }

    const result = await res.json();
    this.setAuthData(result);
    return result;
  }

  private static async fetchWithAuth(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = this.getAccessToken();

    let res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.status === 401) {
      const newToken = await this.refreshToken();
      res = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    }

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message);
    }

    return res;
  }

  private static setAuthData(data: AuthResponse) {
    this.setAccessToken(data.accessToken);
    this.setUser(data.user);
  }

  private static setAccessToken(token: string) {
    if (!isBrowser) return;
    localStorage.setItem(TOKEN_KEY, token);
  }

  private static setUser(user: User) {
    this.setItem(USER_KEY, user);
  }

  private static clearStorage() {
    this.removeItem(TOKEN_KEY);
    this.removeItem(USER_KEY);
  }
}
