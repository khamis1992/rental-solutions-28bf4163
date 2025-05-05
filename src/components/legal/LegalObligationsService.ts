
import { supabase } from '@/lib/supabase';
import { CustomerObligation } from './CustomerLegalObligations';
import { isSuccessResponse, ProfileId } from '@/lib/database';
import { typeGuards } from '@/lib/database/validation';

/**
 * Service to fetch legal obligations for a customer with type safety
 */
export const fetchLegalObligations = async (customerId: string): Promise<CustomerObligation[]> => {
  try {
    // Validate customer ID format
    if (!typeGuards.isString(customerId) || customerId.trim() === '') {
      throw new Error('Invalid customer ID provided');
    }
    
    console.log(`Fetching legal obligations for customer: ${customerId}`);
    
    // In a real implementation, this would fetch from the database with proper types
    // Example code for fetching from database:
    /*
    const response = await supabase
      .from('legal_obligations')
      .select('*, agreements:leases(*)')
      .eq('customer_id', customerId);
      
    if (!isSuccessResponse(response)) {
      throw new Error(`Failed to fetch obligations: ${response.error?.message}`);
    }
    
    return response.data.map(item => ({
      id: item.id,
      customerId: item.customer_id,
      customerName: item.agreements?.customer_name || 'Unknown',
      description: item.description,
      obligationType: item.obligation_type,
      amount: item.amount,
      dueDate: new Date(item.due_date),
      urgency: item.urgency,
      status: item.status,
      daysOverdue: item.days_overdue,
      agreementId: item.agreement_id,
      agreementNumber: item.agreements?.agreement_number
    }));
    */
    
    // For now, we'll return mock data
    // This would be replaced with actual database queries in production
    return [
      {
        id: "ob-1",
        customerId,
        customerName: "Customer Name", // Would be fetched from actual data
        description: "Monthly vehicle lease payment",
        obligationType: "payment",
        amount: 2500,
        dueDate: new Date(),
        urgency: "high",
        status: "overdue",
        daysOverdue: 5,
        agreementId: "agr-123",
        agreementNumber: "AGR-2024-0001"
      },
      {
        id: "ob-2",
        customerId,
        customerName: "Customer Name",
        description: "Document submission deadline",
        obligationType: "document",
        amount: 0,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        urgency: "medium",
        status: "pending",
        daysOverdue: 0
      }
    ];
  } catch (error) {
    console.error("Error fetching legal obligations:", error);
    throw new Error("Failed to fetch legal obligations");
  }
};

/**
 * Type guard for CustomerObligation
 */
export function isCustomerObligation(obj: unknown): obj is CustomerObligation {
  if (!typeGuards.isObject(obj)) return false;
  
  const requiredProps = ['id', 'customerId', 'description', 'obligationType', 'dueDate', 'status'];
  return requiredProps.every(prop => prop in obj);
}

/**
 * Service to create a legal obligation with type safety
 */
export const createLegalObligation = async (obligation: Omit<CustomerObligation, 'id'>): Promise<CustomerObligation | null> => {
  try {
    // In a production environment, you would persist this to the database
    // Example code for creating in database:
    /*
    const { data, error } = await supabase
      .from('legal_obligations')
      .insert({
        customer_id: obligation.customerId,
        description: obligation.description,
        obligation_type: obligation.obligationType,
        amount: obligation.amount,
        due_date: obligation.dueDate,
        urgency: obligation.urgency,
        status: obligation.status,
        days_overdue: obligation.daysOverdue || 0,
        agreement_id: obligation.agreementId
      })
      .select()
      .single();
      
    if (error) {
      throw new Error(`Failed to create obligation: ${error.message}`);
    }
    
    return {
      id: data.id,
      customerId: data.customer_id,
      customerName: obligation.customerName,
      description: data.description,
      obligationType: data.obligation_type,
      amount: data.amount,
      dueDate: new Date(data.due_date),
      urgency: data.urgency,
      status: data.status,
      daysOverdue: data.days_overdue,
      agreementId: data.agreement_id,
      agreementNumber: obligation.agreementNumber
    };
    */
    
    // For now, just return mock data
    return {
      ...obligation,
      id: `ob-${Date.now()}`
    };
  } catch (error) {
    console.error("Error creating legal obligation:", error);
    return null;
  }
};
