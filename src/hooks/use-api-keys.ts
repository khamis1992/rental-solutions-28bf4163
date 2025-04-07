
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ApiKey, CreateApiKeyRequest } from '@/types/api-types';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Simplify, FlattenType } from '@/utils/type-utils';
import { useAuth } from '@/contexts/AuthContext';

export function useApiKeys() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth(); // Get the current authenticated user
  
  // Fetch all API keys for the current user
  const { data: apiKeys, isLoading, error, refetch } = useQuery({
    queryKey: ['api-keys', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('No user logged in, cannot fetch API keys');
        return [];
      }
      
      try {
        console.log('Fetching API keys for user:', user.id);
        const { data, error } = await supabase
          .from('api_keys')
          .select('*')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching API keys:', error);
          throw error;
        }
        console.log('API keys fetch result:', data);
        return data as FlattenType<ApiKey[]>;
      } catch (err) {
        console.error('Exception while fetching API keys:', err);
        throw err;
      }
    },
    enabled: !!user?.id, // Only run the query if user is logged in
  });

  // Create new API key
  const createApiKey = useMutation({
    mutationFn: async (keyData: CreateApiKeyRequest) => {
      setLoading(true);
      try {
        console.log('Creating API key with data:', keyData);
        
        // Call the stored function that creates the API key with a secure random value
        const { data, error } = await supabase
          .rpc('create_api_key', {
            p_name: keyData.name,
            p_description: keyData.description || null,
            p_permissions: keyData.permissions,
            p_expires_at: keyData.expires_at || null
          });
          
        if (error) {
          console.error('API key creation error:', error);
          throw error;
        }
        console.log('API key created successfully:', data);
        return data as FlattenType<ApiKey>;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: () => {
      toast.success('API key created successfully');
      queryClient.invalidateQueries({ queryKey: ['api-keys', user?.id] });
    },
    onError: (error: any) => {
      console.error('Error creating API key:', error);
      toast.error(`Failed to create API key: ${error?.message || 'Unknown error'}`);
    }
  });

  // Revoke API key
  const revokeApiKey = useMutation({
    mutationFn: async (keyId: string) => {
      setLoading(true);
      try {
        console.log('Revoking API key:', keyId);
        // Use the stored procedure for revoking keys
        const { data, error } = await supabase
          .rpc('revoke_api_key', {
            p_key_id: keyId
          });
          
        if (error) {
          console.error('Error revoking API key with RPC:', error);
          throw error;
        }
        console.log('API key revoked successfully:', data);
        return data;
      } catch (error) {
        console.error('RPC failed, falling back to direct update:', error);
        // Fallback to direct update if RPC fails
        const { data, error: updateError } = await supabase
          .from('api_keys')
          .update({ is_active: false })
          .eq('id', keyId)
          .eq('created_by', user?.id) // Make sure user can only update their own keys
          .select();
          
        if (updateError) {
          console.error('Fallback update failed:', updateError);
          throw updateError;
        }
        return data;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: () => {
      toast.success('API key revoked successfully');
      queryClient.invalidateQueries({ queryKey: ['api-keys', user?.id] });
    },
    onError: (error: any) => {
      console.error('Error revoking API key:', error);
      toast.error(`Failed to revoke API key: ${error?.message || 'Unknown error'}`);
    }
  });

  // Get API key usage logs
  const getApiKeyUsage = useCallback(async (keyId: string) => {
    try {
      console.log('Fetching usage logs for API key:', keyId);
      setLoading(true);
      const { data, error } = await supabase
        .from('api_request_logs')
        .select('*')
        .eq('api_key_id', keyId)
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (error) {
        console.error('Error fetching API key usage:', error);
        throw error;
      }
      console.log('API key usage logs:', data);
      return data;
    } catch (error) {
      console.error('Exception while fetching API key usage:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    apiKeys,
    isLoading: isLoading || loading,
    error,
    createApiKey,
    revokeApiKey,
    getApiKeyUsage,
    refetch
  };
}
