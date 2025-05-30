import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { User, UserRole } from '@/types/user.types';
import { Result } from '@/lib/errors/types';
import { createServiceError } from '@/lib/errors/types';

/**
 * Service for managing user accounts and roles
 */
export class UserService extends BaseService {
  constructor() {
    super(supabase);
  }

  async getCurrentUser(): Promise<Result<User>> {
    return this.safeExecute(async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        throw createServiceError(
          'Failed to get current user',
          'UserService',
          'getCurrentUser'
        );
      }

      if (!user) {
        throw createServiceError(
          'No user found',
          'UserService',
          'getCurrentUser'
        );
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw createServiceError(
          'Failed to get user profile',
          'UserService',
          'getCurrentUser'
        );
      }

      return {
        ...user,
        ...profile
      };
    }, 'Failed to get current user');
  }

  async updateUserRole(userId: string, role: UserRole): Promise<Result<User>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw createServiceError(
          'Failed to update user role',
          'UserService',
          'updateUserRole'
        );
      }

      if (!data) {
        throw createServiceError(
          'User not found',
          'UserService',
          'updateUserRole'
        );
      }

      return data;
    }, 'Failed to update user role');
  }

  async deleteUser(userId: string): Promise<Result<boolean>> {
    return this.safeExecute(async () => {
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) {
        throw createServiceError(
          'Failed to delete user',
          'UserService',
          'deleteUser'
        );
      }

      return true;
    }, 'Failed to delete user');
  }

  async updateUserProfile(userId: string, profileData: Partial<User>): Promise<Result<User>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw createServiceError(
          'Failed to update user profile',
          'UserService',
          'updateUserProfile'
        );
      }

      if (!data) {
        throw createServiceError(
          'User not found',
          'UserService',
          'updateUserProfile'
        );
      }

      return data;
    }, 'Failed to update user profile');
  }

  async getAllUsers(): Promise<Result<User[]>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        throw createServiceError(
          'Failed to fetch users',
          'UserService',
          'getAllUsers'
        );
      }

      return data;
    }, 'Failed to fetch users');
  }

  async getUserById(userId: string): Promise<Result<User>> {
    return this.safeExecute(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw createServiceError(
          'Failed to fetch user',
          'UserService',
          'getUserById'
        );
      }

      if (!data) {
        throw createServiceError(
          'User not found',
          'UserService',
          'getUserById'
        );
      }

      return data;
    }, 'Failed to fetch user');
  }
}

export const userService = new UserService();
