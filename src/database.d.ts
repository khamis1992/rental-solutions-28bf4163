
import { Database as DbType } from '@/types/database.types';

// Add Database type extensions
declare module '@/types/database.types' {
  interface Database {
    public: {
      Tables: {
        // Add car_installment_contracts and car_installment_payments tables to the Database type
        car_installment_contracts: {
          Row: {
            id: string;
            car_type: string;
            model_year: number;
            number_of_cars: number;
            price_per_car: number;
            total_contract_value: number;
            amount_paid: number;
            amount_pending: number;
            total_installments: number;
            remaining_installments: number;
            installment_value: number;
            category: string;
            overdue_payments: number;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: string;
            car_type: string;
            model_year: number;
            number_of_cars?: number;
            price_per_car: number;
            total_contract_value: number;
            amount_paid?: number;
            amount_pending: number;
            total_installments: number;
            remaining_installments: number;
            installment_value: number;
            category: string;
            overdue_payments?: number;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            car_type?: string;
            model_year?: number;
            number_of_cars?: number;
            price_per_car?: number;
            total_contract_value?: number;
            amount_paid?: number;
            amount_pending?: number;
            total_installments?: number;
            remaining_installments?: number;
            installment_value?: number;
            category?: string;
            overdue_payments?: number;
            created_at?: string;
            updated_at?: string;
          };
        };
        car_installment_payments: {
          Row: {
            id: string;
            contract_id: string;
            cheque_number: string;
            drawee_bank: string;
            amount: number;
            payment_date: string;
            status: import('@/types/car-installment').PaymentStatusType;
            paid_amount: number;
            remaining_amount: number;
            days_overdue: number;
            payment_notes?: string;
            notes?: string;
            payment_reference?: string;
            reconciliation_status?: string;
            last_payment_check?: string;
            last_payment_date?: string;
            reconciliation_date?: string;
            last_status_change?: string;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: string;
            contract_id: string;
            cheque_number: string;
            drawee_bank: string;
            amount: number;
            payment_date: string;
            status?: import('@/types/car-installment').PaymentStatusType;
            paid_amount?: number;
            remaining_amount?: number;
            days_overdue?: number;
            payment_notes?: string;
            notes?: string;
            payment_reference?: string;
            reconciliation_status?: string;
            last_payment_check?: string;
            last_payment_date?: string;
            reconciliation_date?: string;
            last_status_change?: string;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            contract_id?: string;
            cheque_number?: string;
            drawee_bank?: string;
            amount?: number;
            payment_date?: string;
            status?: import('@/types/car-installment').PaymentStatusType;
            paid_amount?: number;
            remaining_amount?: number;
            days_overdue?: number;
            payment_notes?: string;
            notes?: string;
            payment_reference?: string;
            reconciliation_status?: string;
            last_payment_check?: string;
            last_payment_date?: string;
            reconciliation_date?: string;
            last_status_change?: string;
            created_at?: string;
            updated_at?: string;
          };
        };
      }
    }
  }
}
