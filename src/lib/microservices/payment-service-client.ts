
import { supabase } from '@/lib/supabase';
import { PaymentRow, PaymentInsert, PaymentUpdate, asPaymentStatus } from '@/types/db';
import { toast } from 'sonner';

/**
 * Payment Microservice Client
 * 
 * This client provides an interface to the Payment microservice. It can be used
 * either directly with the database during development or switched to making API
 * calls to the separate microservice once deployed.
 */
export class PaymentServiceClient {
  private baseUrl: string | null = null;
  private readonly useMicroservice: boolean;
  
  constructor(config: { useMicroservice?: boolean; baseUrl?: string } = {}) {
    this.useMicroservice = config.useMicroservice || false;
    this.baseUrl = config.baseUrl || null;
    
    console.log(`Payment Service Client initialized. Using microservice: ${this.useMicroservice}`);
  }
  
  /**
   * Create a new payment
   */
  async createPayment(payment: PaymentInsert): Promise<{ data: PaymentRow | null, error: any }> {
    try {
      if (this.useMicroservice && this.baseUrl) {
        // Microservice API call
        const response = await fetch(`${this.baseUrl}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payment)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          return { data: null, error: errorData };
        }
        
        const data = await response.json();
        return { data, error: null };
      } else {
        // Direct database access during development
        console.log('Creating payment via database', payment);
        const { data, error } = await supabase
          .from('unified_payments')
          .insert(payment)
          .select()
          .single();
        
        return { data: data as PaymentRow || null, error };
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Failed to create payment');
      return { data: null, error };
    }
  }
  
  /**
   * Get payments for an agreement
   */
  async getPaymentsByAgreement(agreementId: string): Promise<{ data: PaymentRow[] | null, error: any }> {
    try {
      if (this.useMicroservice && this.baseUrl) {
        // Microservice API call
        const response = await fetch(`${this.baseUrl}/payments/agreement/${agreementId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          return { data: null, error: errorData };
        }
        
        const data = await response.json();
        return { data, error: null };
      } else {
        // Direct database access during development
        const { data, error } = await supabase
          .from('unified_payments')
          .select('*')
          .eq('agreement_id', agreementId)
          .order('due_date', { ascending: true });
        
        return { data: data as PaymentRow[] || null, error };
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      return { data: null, error };
    }
  }
  
  /**
   * Update a payment
   */
  async updatePayment(id: string, payment: PaymentUpdate): Promise<{ data: PaymentRow | null, error: any }> {
    try {
      if (this.useMicroservice && this.baseUrl) {
        // Microservice API call
        const response = await fetch(`${this.baseUrl}/payments/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payment)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          return { data: null, error: errorData };
        }
        
        const data = await response.json();
        return { data, error: null };
      } else {
        // Direct database access during development
        const { data, error } = await supabase
          .from('unified_payments')
          .update(payment)
          .eq('id', id)
          .select()
          .single();
        
        return { data: data as PaymentRow || null, error };
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Failed to update payment');
      return { data: null, error };
    }
  }
  
  /**
   * Delete a payment
   */
  async deletePayment(id: string): Promise<{ error: any }> {
    try {
      if (this.useMicroservice && this.baseUrl) {
        // Microservice API call
        const response = await fetch(`${this.baseUrl}/payments/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          return { error: errorData };
        }
        
        return { error: null };
      } else {
        // Direct database access during development
        const { error } = await supabase
          .from('unified_payments')
          .delete()
          .eq('id', id);
        
        return { error };
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment');
      return { error };
    }
  }
  
  /**
   * Update payment status
   */
  async updatePaymentStatus(id: string, status: string): Promise<{ data: PaymentRow | null, error: any }> {
    try {
      const validStatus = asPaymentStatus(status);
      
      if (this.useMicroservice && this.baseUrl) {
        // Microservice API call
        const response = await fetch(`${this.baseUrl}/payments/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: validStatus })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          return { data: null, error: errorData };
        }
        
        const data = await response.json();
        return { data, error: null };
      } else {
        // Direct database access during development
        const { data, error } = await supabase
          .from('unified_payments')
          .update({ status: validStatus })
          .eq('id', id)
          .select()
          .single();
        
        return { data: data as PaymentRow || null, error };
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
      return { data: null, error };
    }
  }
}

// Export default instance for direct use
export const paymentServiceClient = new PaymentServiceClient();

// Factory function for creating configured instances
export const createPaymentServiceClient = (config: { useMicroservice?: boolean; baseUrl?: string } = {}) => {
  return new PaymentServiceClient(config);
};
