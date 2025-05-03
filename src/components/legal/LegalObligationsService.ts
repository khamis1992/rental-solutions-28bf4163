
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Define these here since they're not exported from CustomerLegalObligations
export enum ObligationType {
  LatePayment = 'late_payment',
  MissingDocumentation = 'missing_documentation',
  ContractViolation = 'contract_violation',
  LegalAction = 'legal_action',
}

export enum UrgencyLevel {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export interface LegalObligation {
  id: string;
  customerId: string;
  customerName: string;
  obligationType: ObligationType;
  description: string;
  dueDate: Date | null;
  status: 'pending' | 'in_progress' | 'completed';
  urgency: UrgencyLevel;
  amount?: number;
  agreementId?: string;
}

// Fetch overdue payments
export const fetchOverduePayments = async (): Promise<{
  data: LegalObligation[];
  error: string | null;
}> => {
  try {
    // Get overdue payments
    const { data: overduePayments, error: paymentsError } = await supabase
      .from('unified_payments')
      .select(`
        id,
        amount,
        due_date,
        lease_id,
        leases:lease_id (
          customer_id,
          profiles:customer_id (
            full_name
          )
        )
      `)
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString())
      .order('due_date');

    if (paymentsError) {
      return { data: [], error: `Failed to load overdue payments: ${paymentsError.message}` };
    }

    // Map payments to obligations
    const paymentObligations = (overduePayments || []).map(payment => {
      const customerId = payment.leases?.customer_id;
      const customerName = payment.leases?.profiles?.full_name || 'Unknown Customer';

      return {
        id: payment.id,
        customerId: customerId || '',
        customerName,
        obligationType: ObligationType.LatePayment,
        description: `Overdue payment of QAR ${payment.amount}`,
        dueDate: payment.due_date ? new Date(payment.due_date) : null,
        status: 'pending',
        urgency: UrgencyLevel.High,
        amount: payment.amount,
        agreementId: payment.lease_id
      } as LegalObligation;
    });

    return { data: paymentObligations, error: null };
  } catch (error) {
    console.error('Error fetching overdue payments:', error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Failed to load overdue payments'
    };
  }
};

export const useLegalObligations = (customerId?: string) => {
  const [obligations, setObligations] = useState<LegalObligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadObligations() {
      try {
        setLoading(true);

        // Get overdue payments for this customer
        const { data: overduePayments, error: paymentsError } = await supabase
          .from('unified_payments')
          .select(`
            id,
            amount,
            due_date,
            lease_id,
            leases:lease_id (
              customer_id,
              profiles:customer_id (
                full_name
              )
            )
          `)
          .eq('status', 'pending')
          .lt('due_date', new Date().toISOString())
          .order('due_date');

        if (paymentsError) {
          throw new Error(`Failed to load overdue payments: ${paymentsError.message}`);
        }

        // Map payments to obligations
        const paymentObligations = (overduePayments || []).map(payment => {
          const customerId = payment.leases?.customer_id;
          const customerName = payment.leases?.profiles?.full_name || 'Unknown Customer';

          // Skip if we're filtering by customer ID and this isn't a match
          if (customerId && customerId !== customerId) {
            return null;
          }

          return {
            id: payment.id,
            customerId: customerId || '',
            customerName,
            obligationType: ObligationType.LatePayment,
            description: `Overdue payment of QAR ${payment.amount}`,
            dueDate: payment.due_date ? new Date(payment.due_date) : null,
            status: 'pending',
            urgency: UrgencyLevel.High,
            amount: payment.amount,
            agreementId: payment.lease_id
          } as LegalObligation;
        }).filter(Boolean) as LegalObligation[];

        setObligations(paymentObligations);
        setError(null);
      } catch (err) {
        console.error('Error loading legal obligations:', err);
        setError(err instanceof Error ? err : new Error('Failed to load legal obligations'));
        setObligations([]);
      } finally {
        setLoading(false);
      }
    }

    loadObligations();
  }, [customerId]);

  return { obligations, loading, error };
};
