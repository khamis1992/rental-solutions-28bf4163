
import { Database } from "@/types/database.types";

export type DbProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface UserData {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export type UserRole = 'admin' | 'staff' | 'customer';
export type UserStatus = 'active' | 'pending_review' | 'inactive' | 'suspended' | 'blacklisted';
