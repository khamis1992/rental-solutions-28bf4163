
import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ApiKey } from '@/types/api-key';

/**
 * Custom hook for API key management operations
 */
export function useApiKeys() {
  const queryClient = useQueryClient();

  // Query for fetching API keys
  const fetchKeysQuery = useQuery({
    queryKey: ['apiKeys'],
    queryFn: async (): Promise<ApiKey[]> => {
      try {
        console.log("Fetching API keys from database");
        
        // Use direct table query instead of RPC
        const { data, error } = await supabase
          .from('api_keys')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching API keys:", error);
          throw new Error(`Failed to fetch API keys: ${error.message}`);
        }
        
        if (!data) return [];
        
        // Cast to proper type
        return data as ApiKey[];
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch API keys');
        console.error("API key fetch error:", error);
        throw error;
      }
    }
  });

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
        
        // Use direct table insert instead of RPC
        const { data, error } = await supabase
          .from('api_keys')
          .insert({
            name: formData.name,
            description: formData.description || null,
            permissions: formData.permissions,
            expires_at: expiresAt,
            key_value: keyValue,
            created_by: (await supabase.auth.getUser()).data.user?.id
          })
          .select()
          .single();
          
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
        // Use direct table update instead of RPC
        const { data, error } = await supabase
          .from('api_keys')
          .update({ is_active: false })
          .eq('id', keyId)
          .select();
          
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
    apiKeys: fetchKeysQuery.data || [],
    isLoading: fetchKeysQuery.isLoading,
    error: fetchKeysQuery.error,
    fetchApiKeys: () => queryClient.invalidateQueries({ queryKey: ['apiKeys'] }),
    createApiKey,
    revokeApiKey
  };
}
