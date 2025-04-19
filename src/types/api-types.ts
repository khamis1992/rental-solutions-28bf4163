
/**
 * API Key related types
 */

export type ApiKeyPermission = 'vehicles' | 'customers' | 'agreements' | 'traffic-fines' | '*';

export interface ApiKey {
  id: string;
  name: string;
  description?: string;
  key_value: string;
  permissions: ApiKeyPermission[];
  created_at: string;
  created_by?: string;
  expires_at?: string | null;
  last_used_at?: string | null;
  is_active: boolean;
  rate_limit?: number;
  ip_restrictions?: string[] | null;
}

export interface CreateApiKeyRequest {
  name: string;
  description?: string;
  permissions: ApiKeyPermission[];
  expires_at?: string | null;
}

export interface ApiRequestLog {
  id: string;
  api_key_id: string;
  endpoint: string;
  method: string;
  status_code?: number;
  response_time_ms?: number;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
