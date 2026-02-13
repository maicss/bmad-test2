/**
 * Type definitions for authentication
 *
 * Source: Story 1.1 - DTO types for registration and login
 */

export type AuthMethod = 'otp' | 'password';

export interface RegisterRequest {
  type: 'otp' | 'password';
  phone: string;
  password?: string;
  confirmPassword?: string;
  otp?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    phone: string;
    role: string;
  };
}

export interface LoginRequest {
  type: 'otp' | 'password';
  phone: string;
  password?: string;
  otp?: string;
}

export interface SendOTPRequest {
  phone: string;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
  expiresAt?: number;
}
