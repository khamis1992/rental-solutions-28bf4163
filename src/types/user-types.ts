
import { Database } from "@/types/database.types";

export type DbProfileRow = Database['public']['Tables']['profiles']['Row'];

// Ensure this interface is properly exported
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

// Also export as a default to ensure compatibility
export default UserData;
