
export type UserRole = 'admin' | 'staff';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface UserInfo {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  role: UserRole;
  status?: string;
  created_at?: string;
  updated_at?: string;
}
