import type { Database, Json } from '@/integrations/supabase/types';

export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
} from '@/integrations/supabase/types';

// Re-export commonly used types
export type VehicleStatus = Database['public']['Enums']['vehicle_status'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];
export type AgreementStatus = Database['public']['Enums']['lease_status'];
export type AlertPriority = Database['public']['Enums']['alert_priority'];
export type AlertType = Database['public']['Enums']['alert_type'];
export type NotificationStatus = Database['public']['Enums']['notification_status'];
export type UserLocationStatus = Database['public']['Enums']['user_location_status'];

// Helper types
export type DbId = string;
export type DbTimestamp = string;
export type DbJson = Json;

// Type for table rows
export type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TableInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TableUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']; 