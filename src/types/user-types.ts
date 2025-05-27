
export type UserRole = 'admin' | 'staff';
export type UserStatus = 'active' | 'pending_review' | 'inactive' | 'suspended' | 'blacklisted';

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

export interface UserData {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at?: string;
  phone_number?: string;
}

// Database profile row type for Supabase integration
export interface DbProfileRow {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at?: string;
  phone_number?: string;
}

// Export UserData as default for backward compatibility
export default UserData;
