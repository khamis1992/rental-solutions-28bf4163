
import { UserRole, UserStatus } from '@/types/user-types';

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  role?: UserRole;
  status?: UserStatus;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (password: string) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

export interface SessionData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: AuthUser;
}
