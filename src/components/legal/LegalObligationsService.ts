
import { supabase } from '@/lib/supabase';
import { ObligationType, UrgencyLevel, CustomerObligation } from './CustomerLegalObligations';

/**
 * Service to retrieve customer legal obligations
 */
export class LegalObligationsService {
  /**
   * Get all customer legal obligations
   */
  static async getAllObligations(): Promise<CustomerObligation[]> {
    const obligations: CustomerObligation[] = [];
    
    try {
      // Get overdue payments
      const overduePayments = await this.getOverduePayments();
      obligations.push(...overduePayments);

      // Get unpaid traffic fines
      const unpaidFines = await this.getUnpaidTrafficFines();
      obligations.push(...unpaidFines);

      // Get active legal cases
      const legalCases = await this.getActiveLegalCases();
      obligations.push(...legalCases);

      return obligations;
    } catch (error) {
      console.error('Error fetching legal obligations:', error);
      return [];
    }
  }

  /**
   * Get overdue payments as customer obligations
   */
  private static async getOverduePayments(): Promise<CustomerObligation[]> {
    const obligations: CustomerObligation[] = [];
    
    try {
      // Use type assertion to handle potential type mismatches
      const { data: payments, error } = await supabase
        .from('unified_payments')
        .select(`
          id, amount, days_overdue, due_date, description, status,
          balance, payment_date, lease_id
        `)
        .eq('status', 'overdue' as any)
        .order('days_overdue', { ascending: false });
      
      if (error) throw error;
      
      if (!payments || !Array.isArray(payments)) return [];
      
      for (const payment of payments) {
        if (!payment) continue;
        
        // Skip if missing required properties
        if (!payment.lease_id) continue;
        
        // Get the lease details to get customer info
        const { data: lease } = await supabase
          .from('leases')
          .select(`
            id, agreement_number, customer_id
          `)
          .eq('id', payment.lease_id)
          .single();
        
        if (!lease) continue;
        
        // Get customer details
        const { data: customer } = await supabase
          .from('profiles')
          .select(`
            id, full_name
          `)
          .eq('id', lease.customer_id)
          .single();
        
        if (!customer) continue;

        // Add to obligations list
        if (payment.lease_id && payment.id) {
          obligations.push({
            id: payment.id,
            customerId: customer.id,
            customerName: customer.full_name || 'Unknown Customer',
            obligationType: 'payment',
            amount: payment.amount || 0,
            dueDate: new Date(payment.due_date || ''),
            description: payment.description || 'Monthly payment',
            urgency: this.getUrgencyFromDaysOverdue(payment.days_overdue || 0),
            status: 'overdue',
            daysOverdue: payment.days_overdue || 0,
            agreementId: payment.lease_id,
            agreementNumber: lease.agreement_number,
            lateFine: payment.balance ? payment.amount - payment.balance : 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching overdue payments:', error);
    }
    
    return obligations;
  }

  /**
   * Get unpaid traffic fines as customer obligations
   */
  private static async getUnpaidTrafficFines(): Promise<CustomerObligation[]> {
    const obligations: CustomerObligation[] = [];
    
    try {
      // Use type assertion to handle potential type mismatches
      const { data: fines, error } = await supabase
        .from('traffic_fines')
        .select(`
          id, fine_amount, violation_date, violation_charge, payment_status,
          license_plate, lease_id
        `)
        .eq('payment_status', 'pending' as any)
        .order('violation_date', { ascending: false });
      
      if (error) throw error;
      
      if (!fines || !Array.isArray(fines)) return [];
      
      for (const fine of fines) {
        if (!fine) continue;
        
        let customerName = 'Unknown Customer';
        let customerId = '';
        let agreementNumber = '';
        
        if (fine.lease_id) {
          // Get lease details
          const { data: lease } = await supabase
            .from('leases')
            .select(`
              id, agreement_number, customer_id
            `)
            .eq('id', fine.lease_id)
            .single();
          
          if (lease) {
            // Get customer details
            const { data: customer } = await supabase
              .from('profiles')
              .select(`
                id, full_name
              `)
              .eq('id', lease.customer_id)
              .single();
            
            if (customer) {
              customerId = customer.id;
              customerName = customer.full_name || 'Unknown Customer';
              agreementNumber = lease.agreement_number;
            }
          }
        }

        // Calculate days overdue
        const fineDate = fine.violation_date ? new Date(fine.violation_date) : new Date();
        const daysOverdue = Math.floor((Date.now() - fineDate.getTime()) / (1000 * 60 * 60 * 24));

        // Add to obligations list
        obligations.push({
          id: fine.id,
          customerId,
          customerName,
          obligationType: 'traffic_fine',
          amount: fine.fine_amount || 0,
          dueDate: fineDate,
          description: fine.violation_charge || `Traffic fine for ${fine.license_plate}`,
          urgency: this.getUrgencyFromDaysOverdue(daysOverdue),
          status: 'unpaid',
          daysOverdue,
          agreementId: fine.lease_id,
          agreementNumber
        });
      }
    } catch (error) {
      console.error('Error fetching unpaid traffic fines:', error);
    }
    
    return obligations;
  }

  /**
   * Get active legal cases as customer obligations
   */
  private static async getActiveLegalCases(): Promise<CustomerObligation[]> {
    const obligations: CustomerObligation[] = [];
    
    try {
      // Fetch active legal cases
      const { data: cases, error } = await supabase
        .from('legal_cases')
        .select(`
          id, customer_id, case_type, amount_owed, description, status, priority
        `)
        .in('status', ['active', 'pending'] as any[])
        .order('priority', { ascending: false });
      
      if (error) throw error;
      
      if (!cases || !Array.isArray(cases)) return [];
      
      for (const legalCase of cases) {
        if (!legalCase) continue;
        
        // Get customer details
        const { data: customer } = await supabase
          .from('profiles')
          .select(`
            id, full_name
          `)
          .eq('id', legalCase.customer_id)
          .single();
        
        if (!customer) continue;

        // Add to obligations list
        obligations.push({
          id: legalCase.id,
          customerId: legalCase.customer_id,
          customerName: customer.full_name || 'Unknown Customer',
          obligationType: 'legal_case',
          amount: legalCase.amount_owed || 0,
          dueDate: new Date(), // Legal cases don't have a specific due date
          description: legalCase.description || `Legal case: ${legalCase.case_type}`,
          urgency: this.mapPriorityToUrgency(legalCase.priority as string),
          status: legalCase.status || 'active',
          daysOverdue: 0 // Legal cases don't have overdue days
        });
      }
    } catch (error) {
      console.error('Error fetching active legal cases:', error);
    }
    
    return obligations;
  }

  /**
   * Map a legal case priority to urgency level
   */
  private static mapPriorityToUrgency(priority: string): UrgencyLevel {
    switch (priority) {
      case 'high':
        return 'critical';
      case 'medium':
        return 'high';
      case 'low':
        return 'medium';
      default:
        return 'low';
    }
  }

  /**
   * Get urgency level based on days overdue
   */
  private static getUrgencyFromDaysOverdue(daysOverdue: number): UrgencyLevel {
    if (daysOverdue > 60) return 'critical';
    if (daysOverdue > 30) return 'high';
    if (daysOverdue > 15) return 'medium';
    return 'low';
  }
}
