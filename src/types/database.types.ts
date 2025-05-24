export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agreement_imports: {
        Row: {
          created_at: string | null
          created_by: string | null
          delimiter: string | null
          file_name: string | null
          id: string
          original_name: string | null
          processed_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          delimiter?: string | null
          file_name?: string | null
          id?: string
          original_name?: string | null
          processed_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          delimiter?: string | null
          file_name?: string | null
          id?: string
          original_name?: string | null
          processed_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agreement_imports_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      error_logs: {
        Row: {
          created_at: string | null
          error_details: Json | null
          error_message: string
          error_type: string
          id: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          source: string | null
        }
        Insert: {
          created_at?: string | null
          error_details?: Json | null
          error_message: string
          error_type: string
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string | null
          error_details?: Json | null
          error_message: string
          error_type: string
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          source?: string | null
        }
        Relationships: []
      }
      insurance_claims: {
        Row: {
          accident_date: string | null
          claim_number: string | null
          created_at: string | null
          customer_id: string | null
          description: string | null
          id: string
          insurance_company: string | null
          policy_number: string | null
          status: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          accident_date?: string | null
          claim_number?: string | null
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          id?: string
          insurance_company?: string | null
          policy_number?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          accident_date?: string | null
          claim_number?: string | null
          created_at?: string | null
          customer_id?: string | null
          description?: string | null
          id?: string
          insurance_company?: string | null
          policy_number?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_customer_id_fkey"
            columns: ["customer_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_vehicle_id_fkey"
            columns: ["vehicle_id"]
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          }
        ]
      }
      leases: {
        Row: {
          agreement_number: string | null
          agreement_type: string | null
          confirmation_email_sent: boolean | null
          created_at: string | null
          customer_id: string | null
          daily_late_fee: number | null
          deposit_amount: number | null
          down_payment: number | null
          end_date: string | null
          id: string
          notes: string | null
          payment_day: number | null
          payment_frequency: string | null
          rent_amount: number | null
          start_date: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          agreement_number?: string | null
          agreement_type?: string | null
          confirmation_email_sent?: boolean | null
          created_at?: string | null
          customer_id?: string | null
          daily_late_fee?: number | null
          deposit_amount?: number | null
          down_payment?: number | null
          end_date?: string | null
          id?: string
          notes?: string | null
          payment_day?: number | null
          payment_frequency?: string | null
          rent_amount?: number | null
          start_date?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          agreement_number?: string | null
          agreement_type?: string | null
          confirmation_email_sent?: boolean | null
          created_at?: string | null
          customer_id?: string | null
          daily_late_fee?: number | null
          deposit_amount?: number | null
          down_payment?: number | null
          end_date?: string | null
          id?: string
          notes?: string | null
          payment_day?: number | null
          payment_frequency?: string | null
          rent_amount?: number | null
          start_date?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leases_customer_id_fkey"
            columns: ["customer_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_vehicle_id_fkey"
            columns: ["vehicle_id"]
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          }
        ]
      }
      maintenance: {
        Row: {
          comments: string | null
          cost: number | null
          created_at: string | null
          date: string | null
          id: string
          maintenance_provider_id: string | null
          maintenance_type: string | null
          notes: string | null
          odometer_reading: number | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          comments?: string | null
          cost?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          maintenance_provider_id?: string | null
          maintenance_type?: string | null
          notes?: string | null
          odometer_reading?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          comments?: string | null
          cost?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          maintenance_provider_id?: string | null
          maintenance_type?: string | null
          notes?: string | null
          odometer_reading?: number | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_maintenance_provider_id_fkey"
            columns: ["maintenance_provider_id"]
            referencedRelation: "maintenance_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_vehicle_id_fkey"
            columns: ["vehicle_id"]
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          }
        ]
      }
      maintenance_providers: {
        Row: {
          address: string | null
          city: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          phone_number: string | null
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone_number?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone_number?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone_number: string | null
          role: string | null
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone_number?: string | null
          role?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          role?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      traffic_fines: {
        Row: {
          comments: string | null
          cost: number | null
          created_at: string | null
          date: string | null
          description: string | null
          id: string
          notes: string | null
          payment_date: string | null
          reference_number: string | null
          status: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          comments?: string | null
          cost?: number | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          reference_number?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          comments?: string | null
          cost?: number | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          payment_date?: string | null
          reference_number?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traffic_fines_vehicle_id_fkey"
            columns: ["vehicle_id"]
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          }
        ]
      }
      unified_payments: {
        Row: {
          amount: number | null
          amount_paid: number | null
          balance: number | null
          created_at: string | null
          days_overdue: number | null
          description: string | null
          due_date: string | null
          id: string
          late_fine_amount: number | null
          lease_id: string | null
          notes: string | null
          original_due_date: string | null
          payment_date: string | null
          payment_method: string | null
          reference_number: string | null
          status: string | null
          transaction_id: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          amount_paid?: number | null
          balance?: number | null
          created_at?: string | null
          days_overdue?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          late_fine_amount?: number | null
          lease_id?: string | null
          notes?: string | null
          original_due_date?: string | null
          payment_date?: string | null
          payment_method?: string | null
          reference_number?: string | null
          status?: string | null
          transaction_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          amount_paid?: number | null
          balance?: number | null
          created_at?: string | null
          days_overdue?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          late_fine_amount?: number | null
          lease_id?: string | null
          notes?: string | null
          original_due_date?: string | null
          payment_date?: string | null
          payment_method?: string | null
          reference_number?: string | null
          status?: string | null
          transaction_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unified_payments_lease_id_fkey"
            columns: ["lease_id"]
            referencedRelation: "leases"
            referencedColumns: ["id"]
          }
        ]
      }
      vehicles: {
        Row: {
          attention_needed_notes: string | null
          color: string | null
          created_at: string | null
          engine_number: string | null
          id: string
          license_plate: string | null
          make: string | null
          model: string | null
          model_number: string | null
          notes: string | null
          registration_expiry_date: string | null
          status: string | null
          updated_at: string | null
          vin_number: string | null
          year: number | null
        }
        Insert: {
          attention_needed_notes?: string | null
          color?: string | null
          created_at?: string | null
          engine_number?: string | null
          id?: string
          license_plate?: string | null
          make?: string | null
          model?: string | null
          model_number?: string | null
          notes?: string | null
          registration_expiry_date?: string | null
          status?: string | null
          updated_at?: string | null
          vin_number?: string | null
          year?: number | null
        }
        Update: {
          attention_needed_notes?: string | null
          color?: string | null
          created_at?: string | null
          engine_number?: string | null
          id?: string
          license_plate?: string | null
          make?: string | null
          model?: string | null
          model_number?: string | null
          notes?: string | null
          registration_expiry_date?: string | null
          status?: string | null
          updated_at?: string | null
          vin_number?: string | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fix_agreement_payments: {
        Args: {
          agreement_id: string
        }
        Returns: undefined
      }
      generate_missing_payment_records: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
