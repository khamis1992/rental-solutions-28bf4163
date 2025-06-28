import { Json } from './json.types';

export interface Database {
  public: {
    Tables: {
      leases: {
        Row: {
          id: string;
          agreement_number: string | null;
          customer_id: string;
          vehicle_id: string | null;
          start_date: string;
          end_date: string;
          rent_amount: number;
          deposit_amount: number | null;
          down_payment: number | null;
          daily_late_fee: number | null;
          payment_frequency: string | null;
          payment_day: number | null;
          rent_due_day: number | null;
          status: 'active' | 'closed' | 'cancelled' | 'draft' | 'pending' | 'expired';
          agreement_type: 'short_term' | 'long_term' | 'lease_to_own' | null;
          notes: string | null;
          confirmation_email_sent: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['leases']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['leases']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone_number: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          role: string | null;
          created_at: string | null;
          updated_at: string | null;
          driver_license: string | null;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      vehicles: {
        Row: {
          id: string;
          make: string | null;
          model: string | null;
          license_plate: string | null;
          year: number | null;
          vin: string | null;
          color: string | null;
          status: VehicleStatus | null;
          attention_needed_notes: string | null;
          created_at: string | null;
          updated_at: string | null;
          engine_number: string | null;
          model_number: string | null;
          notes: string | null;
        };
        Insert: Omit<Database['public']['Tables']['vehicles']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['vehicles']['Insert']>;
      };
      payment_schedules: {
        Row: {
          id: string;
          lease_id: string;
          amount: number;
          due_date: string;
          status: 'pending' | 'completed' | 'overdue' | 'cancelled';
          description: string | null;
          actual_payment_date: string | null;
          transaction_id: string | null;
          late_fee_applied: number | null;
          balance: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lease_id: string;
          amount: number;
          due_date: string;
          status?: 'pending' | 'completed' | 'overdue' | 'cancelled';
          description?: string | null;
          actual_payment_date?: string | null;
          transaction_id?: string | null;
          late_fee_applied?: number | null;
          balance?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lease_id?: string;
          amount?: number;
          due_date?: string;
          status?: 'pending' | 'completed' | 'overdue' | 'cancelled';
          description?: string | null;
          actual_payment_date?: string | null;
          transaction_id?: string | null;
          late_fee_applied?: number | null;
          balance?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      unified_payments: {
        Row: {
          id: string;
          lease_id: string;
          amount: number;
          amount_paid: number | null;
          balance: number | null;
          payment_date: string | null;
          due_date: string | null;
          transaction_id: string | null;
          payment_method: string | null;
          status: string | null;
          description: string | null;
          type: string | null;
          is_recurring: boolean | null;
          recurring_interval: string | null;
          next_payment_date: string | null;
          late_fine_amount: number | null;
          days_overdue: number | null;
          original_due_date: string | null;
          invoice_id: string | null;
          security_deposit_id: string | null;
          import_reference: string | null;
          import_batch_id: string | null;
          reconciliation_status: string | null;
          reconciliation_date: string | null;
          match_confidence: number | null;
          reference_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['unified_payments']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['unified_payments']['Insert']>;
      };
    }
    Views: {
      [_ in never]: never;
    }
    Functions: {
      calculate_lease_payment: {
        Args: {
          lease_id: string;
          payment_date: string;
        };
        Returns: {
          amount: number;
          currency: string;
          due_date: string;
          status: string;
        };
      };
      get_vehicle_status: {
        Args: {
          vehicle_id: string;
        };
        Returns: {
          status: string;
          last_updated: string;
          location: Json;
        };
      };
      validate_agreement: {
        Args: {
          agreement_id: string;
        };
        Returns: {
          is_valid: boolean;
          validation_errors: Json;
        };
      };
    }
    Enums: {
      alert_priority: 'low' | 'medium' | 'high' | 'critical';
      alert_type: 'system' | 'business' | 'security' | 'maintenance';
      agreement_status: 'draft' | 'pending' | 'active' | 'completed' | 'cancelled' | 'expired';
      document_language: 'en' | 'ar' | 'fr' | 'es';
      notification_status: 'pending' | 'sent' | 'failed' | 'delivered' | 'read';
      payment_status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
      user_location_status: 'active' | 'inactive' | 'offline';
      vehicle_status: 'available' | 'rented' | 'reserved' | 'maintenance' | 'police_station' | 'accident' | 'stolen' | 'retired' | 'out_of_service';
    };
    CompositeTypes: {
      Json: Json;
      address: {
        street: string;
        city: string;
        state: string;
        country: string;
        postal_code: string;
        coordinates?: Json;
      };
      contact_info: {
        email: string;
        phone: string;
        alternative_phone?: string;
        preferred_contact_method: 'email' | 'phone' | 'sms';
      };
      payment_details: {
        amount: number;
        currency: string;
        payment_method: string;
        transaction_id: string;
        status: string;
        metadata?: Json;
      };
      vehicle_details: {
        make: string;
        model: string;
        year: number;
        vin: string;
        license_plate: string;
        specifications: Json;
      };
    };
  }
}

// Helper types for database operations
export type DbTableName = keyof Database['public']['Tables'];
export type DbViewName = keyof Database['public']['Views'];
export type DbFunctionName = keyof Database['public']['Functions'];
export type DbEnumName = keyof Database['public']['Enums'];
export type DbCompositeTypeName = keyof Database['public']['CompositeTypes'];

// Type for table rows
export type TableRow<T extends DbTableName> = Database['public']['Tables'][T]['Row'];
export type TableInsert<T extends DbTableName> = Database['public']['Tables'][T]['Insert'];
export type TableUpdate<T extends DbTableName> = Database['public']['Tables'][T]['Update'];

// Type for view rows
export type ViewRow<T extends DbViewName> = Database['public']['Views'][T]['Row'];

// Type for function arguments and returns
export type FunctionArgs<T extends DbFunctionName> = Database['public']['Functions'][T]['Args'];
export type FunctionReturns<T extends DbFunctionName> = Database['public']['Functions'][T]['Returns'];

// Type for enum values
export type EnumValues<T extends DbEnumName> = Database['public']['Enums'][T];

// Type for composite types
export type CompositeType<T extends DbCompositeTypeName> = Database['public']['CompositeTypes'][T];

// Helper type for database IDs
export type DbId = string;

// Helper type for database timestamps
export type DbTimestamp = string;

// Helper type for database JSON
export type DbJson = Json;

// Helper type for database relationships
export type DbRelationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

// Type aliases for specific enums
export type VehicleStatus = Database['public']['Enums']['vehicle_status'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];
export type AgreementStatus = Database['public']['Enums']['agreement_status'];
export type AlertPriority = Database['public']['Enums']['alert_priority'];
export type AlertType = Database['public']['Enums']['alert_type'];
export type NotificationStatus = Database['public']['Enums']['notification_status'];
export type UserLocationStatus = Database['public']['Enums']['user_location_status'];
