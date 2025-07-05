
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { UserRole, UserStatus } from '@/types/user-types';

export interface UserManagementFilters {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

export const getAllUsers = async (filters: UserManagementFilters = {}) => {
  try {
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.role) {
      query = query.eq('role', filters.role);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return { data: [], error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { data: [], error };
  }
};

export const updateUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
      return false;
    }

    toast.success('User role updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    toast.error('Failed to update user role');
    return false;
  }
};

export const updateUserStatus = async (userId: string, status: UserStatus): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
      return false;
    }

    toast.success('User status updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating user status:', error);
    toast.error('Failed to update user status');
    return false;
  }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
      return false;
    }

    toast.success('User deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    toast.error('Failed to delete user');
    return false;
  }
};
