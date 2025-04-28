export interface Database {
  public: {
    Tables: {
      leases: {
        Row: {
          id: string;
          status: 'active' | 'pending' | 'completed' | 'cancelled' | 'pending_payment' | 'pending_deposit' | 'draft' | 'terminated' | 'archived' | 'closed';
          customer_id: string;
          vehicle_id: string;
          agreement_number: string;
          start_date: string | null;
          end_date: string | null;
          rent_amount: number;
          total_amount: number;
          deposit_amount: number | null;
          daily_late_fee: number | null;
          agreement_type: 'short_term' | 'long_term' | 'rental' | 'lease_to_own';
          agreement_duration: unknown;
          rent_due_day: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          last_payment_date: string | null;
        };
        Insert: {
          id?: string;
          status?: 'active' | 'pending' | 'completed' | 'cancelled' | 'pending_payment' | 'pending_deposit' | 'draft' | 'terminated' | 'archived' | 'closed';
          customer_id: string;
          vehicle_id: string;
          agreement_number?: string;
          start_date?: string | null;
          end_date?: string | null;
          rent_amount?: number;
          total_amount: number;
          deposit_amount?: number | null;
          daily_late_fee?: number | null;
          agreement_type: 'short_term' | 'long_term' | 'rental' | 'lease_to_own';
          agreement_duration: unknown;
          rent_due_day?: number | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          status?: 'active' | 'pending' | 'completed' | 'cancelled' | 'pending_payment' | 'pending_deposit' | 'draft' | 'terminated' | 'archived' | 'closed';
          customer_id?: string;
          vehicle_id?: string;
          agreement_number?: string;
          start_date?: string | null;
          end_date?: string | null;
          rent_amount?: number;
          total_amount?: number;
          deposit_amount?: number | null;
          daily_late_fee?: number | null;
          agreement_type?: 'short_term' | 'long_term' | 'rental' | 'lease_to_own';
          agreement_duration?: unknown;
          rent_due_day?: number | null;
          notes?: string | null;
          updated_at?: string;
          last_payment_date?: string | null;
        };
      };
      unified_payments: {
        Row: {
          id: string;
          lease_id: string;
          amount: number;
          amount_paid: number;
          balance: number;
          payment_date: string | null;
          due_date: string | null;
          status: string;
          payment_method: string | null;
          description: string | null;
          type: string;
          created_at: string;
          updated_at: string;
          late_fine_amount: number;
          days_overdue: number;
          original_due_date: string | null;
          transaction_id: string | null;
          import_reference: string | null;
          is_recurring: boolean;
          recurring_interval: unknown | null;
          next_payment_date: string | null;
        };
        Insert: {
          id?: string;
          lease_id: string;
          amount: number;
          amount_paid?: number;
          balance?: number;
          payment_date?: string | null;
          due_date?: string | null;
          status?: string;
          payment_method?: string | null;
          description?: string | null;
          type?: string;
          created_at?: string;
          updated_at?: string;
          late_fine_amount?: number;
          days_overdue?: number;
          original_due_date?: string | null;
          transaction_id?: string | null;
          import_reference?: string | null;
          is_recurring?: boolean;
          recurring_interval?: unknown | null;
          next_payment_date?: string | null;
        };
        Update: {
          lease_id?: string;
          amount?: number;
          amount_paid?: number;
          balance?: number;
          payment_date?: string | null;
          due_date?: string | null;
          status?: string;
          payment_method?: string | null;
          description?: string | null;
          type?: string;
          updated_at?: string;
          late_fine_amount?: number;
          days_overdue?: number;
          original_due_date?: string | null;
          transaction_id?: string | null;
          import_reference?: string | null;
          is_recurring?: boolean;
          recurring_interval?: unknown | null;
          next_payment_date?: string | null;
        };
      };
      traffic_fines: {
        Row: {
          id: string;
          violation_number: string;
          license_plate: string;
          vehicle_id: string;
          lease_id: string;
          agreement_id: string;
          violation_date: string;
          fine_amount: number;
          violation_charge: string;
          payment_status: string;
          fine_location: string;
          payment_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          violation_number: string;
          license_plate: string;
          vehicle_id?: string;
          lease_id?: string;
          agreement_id?: string;
          violation_date: string;
          fine_amount: number;
          violation_charge?: string;
          payment_status?: string;
          fine_location?: string;
          payment_date?: string | null;
        };
        Update: {
          violation_number?: string;
          license_plate?: string;
          vehicle_id?: string;
          lease_id?: string;
          agreement_id?: string;
          violation_date?: string;
          fine_amount?: number;
          violation_charge?: string;
          payment_status?: string;
          fine_location?: string;
          payment_date?: string | null;
          updated_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          make: string;
          model: string;
          year: number;
          license_plate: string;
          vin: string;
          color: string | null;
          image_url: string | null;
          mileage: number | null;
          status: 'available' | 'rented' | 'maintenance' | 'retired' | 'police_station' | 'accident' | 'stolen' | 'reserved';
          created_at: string;
          updated_at: string;
          description: string | null;
          location: string | null;
          insurance_company: string | null;
          insurance_expiry: string | null;
          rent_amount: number | null;
          vehicle_type_id: string | null;
        };
        Insert: {
          id?: string;
          make: string;
          model: string;
          year: number;
          license_plate: string;
          vin: string;
          color?: string | null;
          image_url?: string | null;
          mileage?: number | null;
          status?: 'available' | 'rented' | 'maintenance' | 'retired' | 'police_station' | 'accident' | 'stolen' | 'reserved';
          description?: string | null;
          location?: string | null;
          insurance_company?: string | null;
          insurance_expiry?: string | null;
          rent_amount?: number | null;
          vehicle_type_id?: string | null;
        };
        Update: {
          make?: string;
          model?: string;
          year?: number;
          license_plate?: string;
          vin?: string;
          color?: string | null;
          image_url?: string | null;
          mileage?: number | null;
          status?: 'available' | 'rented' | 'maintenance' | 'retired' | 'police_station' | 'accident' | 'stolen' | 'reserved';
          updated_at?: string;
          description?: string | null;
          location?: string | null;
          insurance_company?: string | null;
          insurance_expiry?: string | null;
          rent_amount?: number | null;
          vehicle_type_id?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone_number: string | null;
          address: string | null;
          driver_license: string | null;
          nationality: string | null;
          role: string | null;
          status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          phone_number?: string | null;
          address?: string | null;
          driver_license?: string | null;
          nationality?: string | null;
          role?: string | null;
          status?: string | null;
        };
        Update: {
          full_name?: string | null;
          email?: string | null;
          phone_number?: string | null;
          address?: string | null;
          driver_license?: string | null;
          nationality?: string | null;
          role?: string | null;
          status?: string | null;
          updated_at?: string;
        };
      };
      legal_cases: {
        Row: {
          id: string;
          customer_id: string;
          status: string;
          amount_owed: number;
          assigned_to: string | null;
          last_reminder_sent: string | null;
          reminder_count: number | null;
          escalation_date: string | null;
          resolution_notes: string | null;
          description: string | null;
          resolution_date: string | null;
          case_type: string;
          priority: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          status?: string;
          amount_owed?: number;
          assigned_to?: string | null;
          last_reminder_sent?: string | null;
          reminder_count?: number | null;
          escalation_date?: string | null;
          resolution_notes?: string | null;
          description?: string | null;
          resolution_date?: string | null;
          case_type: string;
          priority?: string | null;
        };
        Update: {
          customer_id?: string;
          status?: string;
          amount_owed?: number;
          assigned_to?: string | null;
          last_reminder_sent?: string | null;
          reminder_count?: number | null;
          escalation_date?: string | null;
          resolution_notes?: string | null;
          description?: string | null;
          resolution_date?: string | null;
          case_type?: string;
          priority?: string | null;
          updated_at?: string;
        };
      };
      overdue_payments: {
        Row: {
          id: string;
          agreement_id: string;
          customer_id: string;
          total_amount: number;
          amount_paid: number;
          balance: number;
          last_payment_date: string | null;
          days_overdue: number;
          status: string;
          created_at: string;
          updated_at: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          agreement_id: string;
          customer_id: string;
          total_amount: number;
          amount_paid: number;
          balance: number;
          last_payment_date?: string | null;
          days_overdue?: number;
          status?: string;
          notes?: string | null;
        };
        Update: {
          agreement_id?: string;
          customer_id?: string;
          total_amount?: number;
          amount_paid?: number;
          balance?: number;
          last_payment_date?: string | null;
          days_overdue?: number;
          status?: string;
          updated_at?: string;
          notes?: string | null;
        };
      };
      agreement_import_reverts: {
        Row: {
          id: string;
          import_id: string;
          deleted_count: number;
          reason: string | null;
          created_at: string;
          reverted_by: string | null;
        };
        Insert: {
          id?: string;
          import_id: string;
          deleted_count: number;
          reason?: string | null;
          reverted_by?: string | null;
        };
        Update: {
          import_id?: string;
          deleted_count?: number;
          reason?: string | null;
          reverted_by?: string | null;
        };
      };
      company_settings: {
        Row: {
          id: string;
          company_name: string | null;
          business_email: string | null;
          phone: string | null;
          address: string | null;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
          automatic_updates: boolean | null;
          dark_mode: boolean | null;
        };
        Insert: {
          id?: string;
          company_name?: string | null;
          business_email?: string | null;
          phone?: string | null;
          address?: string | null;
          logo_url?: string | null;
          automatic_updates?: boolean | null;
          dark_mode?: boolean | null;
        };
        Update: {
          company_name?: string | null;
          business_email?: string | null;
          phone?: string | null;
          address?: string | null;
          logo_url?: string | null;
          updated_at?: string;
          automatic_updates?: boolean | null;
          dark_mode?: boolean | null;
        };
      };
      system_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          setting_key: string;
          setting_value: unknown;
        };
        Update: {
          setting_key?: string;
          setting_value?: unknown;
          updated_at?: string;
        };
      };
    };
  };
}

export type DbTables = Database['public']['Tables'];

// Generate helper types for each table
export type LeaseRow = Database['public']['Tables']['leases']['Row'];
export type PaymentRow = Database['public']['Tables']['unified_payments']['Row'];
export type VehicleRow = Database['public']['Tables']['vehicles']['Row'];
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type TrafficFineRow = Database['public']['Tables']['traffic_fines']['Row'];
export type LegalCaseRow = Database['public']['Tables']['legal_cases']['Row'];
