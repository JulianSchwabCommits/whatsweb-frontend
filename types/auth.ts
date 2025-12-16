// Authentication related types and interfaces

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  fullName: string;
}

export interface LoginRequest {
  email: string;
  username?: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ErrorResponse {
  message: string;
  error: string;
  statusCode: number;
}
