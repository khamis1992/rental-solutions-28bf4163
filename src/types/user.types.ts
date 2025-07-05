export type UserRole = 'admin' | 'manager' | 'staff' | 'customer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  created_at?: string;
  updated_at?: string;
  last_sign_in_at?: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
} 