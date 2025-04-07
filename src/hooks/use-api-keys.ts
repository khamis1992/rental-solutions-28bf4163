
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ApiKey, CreateApiKeyRequest } from '@/types/api-types';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Simplify, FlattenType } from '@/utils/type-utils';

export function useApiKeys() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Fetch all API keys
  const { data: apiKeys, isLoading, error, refetch } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as FlattenType<ApiKey[]>;
    }
  });

  // Create new API key
  const createApiKey = useMutation({
    mutationFn: async (keyData: CreateApiKeyRequest) => {
      setLoading(true);
      try {
        // Call the stored function that creates the API key with a secure random value
        // Note: The parameter order matters and must match the function signature in the database
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
        return data as FlattenType<ApiKey>;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: () => {
      toast.success('API key created successfully');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      refetch(); // Immediately refetch the API keys list to show the new key
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
        // Use the stored procedure for revoking keys
        const { data, error } = await supabase
          .rpc('revoke_api_key', {
            p_key_id: keyId
          });
          
        if (error) throw error;
        return data;
      } catch (error) {
        // Fallback to direct update if RPC fails
        const { data, error: updateError } = await supabase
          .from('api_keys')
          .update({ is_active: false })
          .eq('id', keyId)
          .select();
          
        if (updateError) throw updateError;
        return data;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: () => {
      toast.success('API key revoked successfully');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      refetch(); // Immediately refetch the API keys list after revoking
    },
    onError: (error: any) => {
      console.error('Error revoking API key:', error);
      toast.error(`Failed to revoke API key: ${error?.message || 'Unknown error'}`);
    }
  });

  // Get API key usage logs
  const getApiKeyUsage = useCallback(async (keyId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('api_request_logs')
        .select('*')
        .eq('api_key_id', keyId)
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching API key usage:', error);
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
