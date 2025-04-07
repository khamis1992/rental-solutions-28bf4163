
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ApiKey } from '@/types/api-key';
import { MutationVariables, Simplify } from '@/utils/type-utils';

/**
 * Custom hook for API key management operations
 */
export function useApiKeys() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const queryClient = useQueryClient();

  // Fetch API keys function
  const fetchApiKeys = async (): Promise<ApiKey[]> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use the raw PostgreSQL query through RPC to avoid type issues
      const { data, error: queryError } = await supabase
        .rpc('get_api_keys');

      if (queryError) {
        throw new Error(`Failed to fetch API keys: ${queryError.message}`);
      }
      
      const keys = data as ApiKey[];
      setApiKeys(keys);
      return keys;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch API keys');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Create API key mutation
  const createApiKey = useMutation({
    mutationFn: async (formData: {
      name: string;
      description: string;
      permissions: string[];
      expiresIn: string;
    }) => {
      try {
        // Calculate expiry date if needed
        let expiresAt = null;
        const daysToExpire = parseInt(formData.expiresIn, 10);
        
        if (daysToExpire > 0) {
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + daysToExpire);
          expiresAt = expiry.toISOString();
        }
        
        // Generate a unique key value
        const keyValue = crypto.randomUUID().replace(/-/g, '');
        
        // Use RPC to insert the new API key
        const { data, error } = await supabase
          .rpc('create_api_key', {
            p_name: formData.name,
            p_description: formData.description || null,
            p_permissions: formData.permissions,
            p_expires_at: expiresAt,
            p_key_value: keyValue
          });
          
        if (error) throw new Error(`Failed to create API key: ${error.message}`);
        
        return data as ApiKey;
      } catch (err) {
        console.error('Error creating API key:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast.success('API key created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create API key: ${error.message}`);
    },
  });

  // Revoke API key mutation
  const revokeApiKey = useMutation({
    mutationFn: async (keyId: string) => {
      try {
        // Use RPC to revoke the API key
        const { data, error } = await supabase
          .rpc('revoke_api_key', {
            p_key_id: keyId
          });
          
        if (error) throw new Error(`Failed to revoke API key: ${error.message}`);
        
        return data;
      } catch (err) {
        console.error('Error revoking API key:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
      toast.success('API key revoked successfully');
    },
    onError: (error) => {
      toast.error(`Failed to revoke API key: ${error.message}`);
    },
  });

  return {
    apiKeys,
    isLoading,
    error,
    fetchApiKeys,
    createApiKey,
    revokeApiKey
  };
}
