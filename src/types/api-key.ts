
export interface ApiKey {
  id: string;
  name: string;
  description: string | null;
  key_value: string;
  permissions: string[];
  created_at: string;
  created_by?: string;
  expires_at: string | null;
  last_used_at: string | null;
  is_active: boolean;
  rate_limit?: number;
  ip_restrictions?: string[] | null;
}
