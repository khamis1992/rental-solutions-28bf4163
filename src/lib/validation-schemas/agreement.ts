import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

export enum AgreementStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  DRAFT = 'draft'
}

export enum DB_AGREEMENT_STATUS {
  ACTIVE = 'active',
  PENDING_PAYMENT = 'pending_payment',
  COMPLETED = 'completed',
  TERMINATED = 'terminated',
  CANCELLED = 'cancelled',
  ARCHIVED = 'archived',
  PENDING_DEPOSIT = 'pending_deposit',
  CLOSED = 'closed',
  DRAFT = 'draft'
}

export type DatabaseAgreementStatus = 
  | 'active' 
  | 'pending_payment' 
  | 'completed' 
  | 'terminated'
  | 'cancelled'
  | 'archived'
  | 'pending_deposit'
  | 'closed'
  | 'draft';

export const mapDBStatusToFrontend = (status: DatabaseAgreementStatus): AgreementStatus => {
  switch (status) {
    case DB_AGREEMENT_STATUS.ACTIVE:
      return AgreementStatus.ACTIVE;
    case DB_AGREEMENT_STATUS.PENDING_PAYMENT:
    case DB_AGREEMENT_STATUS.PENDING_DEPOSIT:
      return AgreementStatus.PENDING;
    case DB_AGREEMENT_STATUS.COMPLETED:
    case DB_AGREEMENT_STATUS.TERMINATED:
    case DB_AGREEMENT_STATUS.CLOSED:
      return AgreementStatus.CLOSED;
    case DB_AGREEMENT_STATUS.CANCELLED:
      return AgreementStatus.CANCELLED;
    case DB_AGREEMENT_STATUS.ARCHIVED:
      return AgreementStatus.EXPIRED;
    case DB_AGREEMENT_STATUS.DRAFT:
      return AgreementStatus.DRAFT;
    default:
      return AgreementStatus.DRAFT;
  }
};

export const mapFrontendStatusToDB = (status: AgreementStatus): DatabaseAgreementStatus => {
  switch (status) {
    case AgreementStatus.ACTIVE:
      return DB_AGREEMENT_STATUS.ACTIVE;
    case AgreementStatus.PENDING:
      return DB_AGREEMENT_STATUS.PENDING_PAYMENT;
    case AgreementStatus.CLOSED:
      return DB_AGREEMENT_STATUS.COMPLETED;
    case AgreementStatus.CANCELLED:
      return DB_AGREEMENT_STATUS.CANCELLED;
    case AgreementStatus.EXPIRED:
      return DB_AGREEMENT_STATUS.ARCHIVED;
    case AgreementStatus.DRAFT:
      return DB_AGREEMENT_STATUS.DRAFT;
    default:
      return DB_AGREEMENT_STATUS.DRAFT;
  }
};

export const agreementSchema = z.object({
  id: z.string().uuid(),
  customer_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  start_date: z.date(),
  end_date: z.date(),
  status: z.nativeEnum(AgreementStatus),
  terms_accepted: z.boolean().default(false),
  additional_drivers: z.array(z.string()).optional(),
});

export const baseAgreementSchema = z.object({
  id: z.string().uuid(),
  customer_id: z.string().uuid().optional(),
  vehicle_id: z.string().uuid().optional(),
  start_date: z.date(),
  end_date: z.date(),
  status: z.nativeEnum(AgreementStatus),
});

export type BaseAgreement = z.infer<typeof baseAgreementSchema>;
export type Agreement = z.infer<typeof agreementSchema>;

export const forceGeneratePaymentForAgreement = async (
  supabaseClient: any, 
  agreementId: string, 
  specificDate?: Date
) => {
  try {
    // Get agreement details
    const { data: agreement, error: agreementError } = await supabaseClient
      .from('leases')
      .select('*')
      .eq('id', agreementId)
      .single();
      
    if (agreementError) {
      console.error("Error fetching agreement:", agreementError);
      return {
        success: false,
        message: `Error fetching agreement: ${agreementError.message}`
      };
    }
    
    if (!agreement) {
      return {
        success: false,
        message: "Agreement not found"
      };
    }
    
    // Determine payment date
    const paymentDate = specificDate || new Date();
    const dueDay = agreement.rent_due_day || 1;
    
    // Create a due date for the current month with the specified due day
    const dueDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), dueDay);
    
    // If the due date is in the past for the current month, set status to overdue
    const today = new Date();
    const paymentStatus = dueDate < today ? 'overdue' : 'pending';
    const daysOverdue = dueDate < today ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    // Calculate late fee if applicable
    const dailyLateFee = agreement.daily_late_fee || 120; // Default to 120 QAR if not specified
    const lateFineAmount = daysOverdue > 0 ? Math.min(daysOverdue * dailyLateFee, 3000) : 0;
    
    // Insert the payment record
    const { data: newPayment, error: insertError } = await supabaseClient
      .from('unified_payments')
      .insert({
        lease_id: agreementId,
        amount: agreement.rent_amount || 0,
        description: `Monthly Rent - ${paymentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
        type: 'rent',
        status: paymentStatus,
        payment_date: null,
        due_date: dueDate.toISOString(),
        original_due_date: dueDate.toISOString(),
        days_overdue: daysOverdue,
        late_fine_amount: lateFineAmount,
        daily_late_fee: dailyLateFee
      })
      .select()
      .single();
      
    if (insertError) {
      console.error("Error creating payment:", insertError);
      return {
        success: false,
        message: `Error creating payment: ${insertError.message}`
      };
    }
    
    return {
      success: true,
      message: `Payment generated successfully for ${paymentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      payment: newPayment
    };
  } catch (error) {
    console.error("Unexpected error in forceGeneratePaymentForAgreement:", error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

export const analyzeAgreementStatus = async (agreement: any) => {
  try {
    // Get payment history for this agreement
    const { data: payments, error: paymentsError } = await supabase
      .from('unified_payments')
      .select('*')
      .eq('lease_id', agreement.id);
      
    if (paymentsError) {
      console.error("Error fetching payments for analysis:", paymentsError);
    }
    
    // Get customer information
    const { data: customer, error: customerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', agreement.customer_id)
      .single();
      
    if (customerError) {
      console.error("Error fetching customer for analysis:", customerError);
    }
    
    // Get vehicle information
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', agreement.vehicle_id)
      .single();
      
    if (vehicleError) {
      console.error("Error fetching vehicle for analysis:", vehicleError);
    }
    
    // Analyze the agreement status
    let recommendedStatus = agreement.status;
    let confidence = 0.75;
    let riskLevel = 'low';
    let explanation = "No issues detected with this agreement.";
    let actionItems: string[] = [];
    
    // Check for payment issues
    if (payments && payments.length > 0) {
      const overduePayments = payments.filter(p => p.status === 'overdue' || (p.status === 'pending' && p.days_overdue > 0));
      const totalPayments = payments.length;
      
      if (overduePayments.length > 0) {
        const overdueRatio = overduePayments.length / totalPayments;
        
        if (overdueRatio > 0.5) {
          // More than half of payments are overdue
          recommendedStatus = 'cancelled';
          confidence = 0.9;
          riskLevel = 'high';
          explanation = `${overduePayments.length} out of ${totalPayments} payments are overdue. This agreement has significant payment issues.`;
          actionItems.push("Contact customer about overdue payments");
          actionItems.push("Consider terminating the agreement");
        } else if (overdueRatio > 0.25) {
          // Between 25% and 50% of payments are overdue
          recommendedStatus = 'pending_payment';
          confidence = 0.8;
          riskLevel = 'medium';
          explanation = `${overduePayments.length} out of ${totalPayments} payments are overdue. This agreement has payment issues that need attention.`;
          actionItems.push("Send payment reminder to customer");
        } else {
          // Less than 25% of payments are overdue
          riskLevel = 'low';
          explanation = `${overduePayments.length} out of ${totalPayments} payments are overdue. The agreement generally has good payment history with minor issues.`;
        }
      } else {
        // No overdue payments
        explanation = "All payments are up to date.";
      }
    } else {
      explanation = "No payment history available for analysis.";
    }
    
    // Check agreement dates
    const now = new Date();
    const startDate = new Date(agreement.start_date);
    const endDate = new Date(agreement.end_date);
    
    if (endDate < now && agreement.status === 'active') {
      recommendedStatus = 'completed';
      confidence = 0.95;
      explanation += " Agreement end date has passed and should be marked as completed.";
      actionItems.push("Close the agreement as it has reached its end date");
    }
    
    if (startDate > now && agreement.status === 'active') {
      recommendedStatus = 'pending_payment';
      confidence = 0.95;
      explanation += " Agreement start date is in the future but status is active.";
      actionItems.push("Change status to pending until start date arrives");
    }
    
    return {
      recommendedStatus,
      confidence,
      riskLevel,
      analyzedAt: new Date().toISOString(),
      explanation,
      actionItems
    };
  } catch (error) {
    console.error("Error in analyzeAgreementStatus:", error);
    return {
      recommendedStatus: 'active',
      confidence: 0.5,
      riskLevel: 'medium',
      analyzedAt: new Date().toISOString(),
      explanation: "Error occurred during analysis.",
      actionItems: ["Review agreement manually due to analysis error"]
    };
  }
};
