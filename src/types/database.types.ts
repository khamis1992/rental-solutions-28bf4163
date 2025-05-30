
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
      leases: {
        Row: {
          id: string
          agreement_number: string | null
          customer_id: string
          vehicle_id: string | null
          start_date: string
          end_date: string
          rent_amount: number
          deposit_amount: number | null
          down_payment: number | null
          daily_late_fee: number | null
          payment_frequency: string | null
          payment_day: number | null
          rent_due_day: number | null
          status: 'active' | 'closed' | 'cancelled' | 'draft' | 'pending' | 'expired'
          agreement_type: 'short_term' | 'long_term' | 'lease_to_own' | null
          notes: string | null
          confirmation_email_sent: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agreement_number?: string | null
          customer_id: string
          vehicle_id?: string | null
          start_date: string
          end_date: string
          rent_amount: number
          deposit_amount?: number | null
          down_payment?: number | null
          daily_late_fee?: number | null
          payment_frequency?: string | null
          payment_day?: number | null
          rent_due_day?: number | null
          status?: 'active' | 'closed' | 'cancelled' | 'draft' | 'pending' | 'expired'
          agreement_type?: 'short_term' | 'long_term' | 'lease_to_own' | null
          notes?: string | null
          confirmation_email_sent?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agreement_number?: string | null
          customer_id?: string
          vehicle_id?: string | null
          start_date?: string
          end_date?: string
          rent_amount?: number
          deposit_amount?: number | null
          down_payment?: number | null
          daily_late_fee?: number | null
          payment_frequency?: string | null
          payment_day?: number | null
          rent_due_day?: number | null
          status?: 'active' | 'closed' | 'cancelled' | 'draft' | 'pending' | 'expired'
          agreement_type?: 'short_term' | 'long_term' | 'lease_to_own' | null
          notes?: string | null
          confirmation_email_sent?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string | null
          phone_number: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          role: string | null
          created_at: string | null
          updated_at: string | null
          driver_license: string | null
        }
        Insert: {
          id: string
          full_name: string
          email?: string | null
          phone_number?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          role?: string | null
          created_at?: string | null
          updated_at?: string | null
          driver_license?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          email?: string | null
          phone_number?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          role?: string | null
          created_at?: string | null
          updated_at?: string | null
          driver_license?: string | null
        }
      }
      vehicles: {
        Row: {
          id: string
          make: string | null
          model: string | null
          license_plate: string | null
          year: number | null
          vin: string | null
          color: string | null
          status: string | null
          attention_needed_notes: string | null
          created_at: string | null
          updated_at: string | null
          engine_number: string | null
          model_number: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          make?: string | null
          model?: string | null
          license_plate?: string | null
          year?: number | null
          vin?: string | null
          color?: string | null
          status?: string | null
          attention_needed_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          engine_number?: string | null
          model_number?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          make?: string | null
          model?: string | null
          license_plate?: string | null
          year?: number | null
          vin?: string | null
          color?: string | null
          status?: string | null
          attention_needed_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          engine_number?: string | null
          model_number?: string | null
          notes?: string | null
        }
      }
      payment_schedules: {
        Row: {
          id: string
          lease_id: string
          amount: number
          due_date: string
          status: 'pending' | 'completed' | 'overdue' | 'cancelled'
          description: string | null
          actual_payment_date: string | null
          transaction_id: string | null
          late_fee_applied: number | null
          balance: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lease_id: string
          amount: number
          due_date: string
          status?: 'pending' | 'completed' | 'overdue' | 'cancelled'
          description?: string | null
          actual_payment_date?: string | null
          transaction_id?: string | null
          late_fee_applied?: number | null
          balance?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lease_id?: string
          amount?: number
          due_date?: string
          status?: 'pending' | 'completed' | 'overdue' | 'cancelled'
          description?: string | null
          actual_payment_date?: string | null
          transaction_id?: string | null
          late_fee_applied?: number | null
          balance?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      unified_payments: {
        Row: {
          id: string
          lease_id: string
          amount: number
          amount_paid: number | null
          balance: number | null
          payment_date: string | null
          payment_method: string | null
          reference_number: string | null
          description: string | null
          status: string
          type: string | null
          days_overdue: number | null
          late_fine_amount: number | null
          original_due_date: string | null
          payment_reference: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lease_id: string
          amount: number
          amount_paid?: number | null
          balance?: number | null
          payment_date?: string | null
          payment_method?: string | null
          reference_number?: string | null
          description?: string | null
          status: string
          type?: string | null
          days_overdue?: number | null
          late_fine_amount?: number | null
          original_due_date?: string | null
          payment_reference?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lease_id?: string
          amount?: number
          amount_paid?: number | null
          balance?: number | null
          payment_date?: string | null
          payment_method?: string | null
          reference_number?: string | null
          description?: string | null
          status?: string
          type?: string | null
          days_overdue?: number | null
          late_fine_amount?: number | null
          original_due_date?: string | null
          payment_reference?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
