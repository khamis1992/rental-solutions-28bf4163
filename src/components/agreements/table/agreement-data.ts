
import { SimpleAgreement } from '@/hooks/use-agreements';
import { Agreement } from '@/types/agreement';

export function processAgreementData(agreements: SimpleAgreement[]): Agreement[] {
  // Convert SimpleAgreement to Agreement with proper type safety
  return agreements?.map((agreement: SimpleAgreement): Agreement => ({
    // Core database fields - directly mapped from SimpleAgreement
    id: agreement.id,
    agreement_number: agreement.agreement_number,
    status: agreement.status,
    start_date: agreement.start_date,
    end_date: agreement.end_date,
    rent_amount: agreement.rent_amount,
    customer_id: agreement.customer_id,
    vehicle_id: agreement.vehicle_id,
    payment_frequency: agreement.payment_frequency,
    payment_day: agreement.payment_day,
    rent_due_day: agreement.rent_due_day,
    confirmation_email_sent: agreement.confirmation_email_sent,
    daily_late_fee: agreement.daily_late_fee,
    deposit_amount: agreement.deposit_amount,
    down_payment: agreement.down_payment,
    notes: agreement.notes,
    created_at: agreement.created_at,
    updated_at: agreement.updated_at,
    
    // Required database fields with sensible defaults
    agreement_type: 'short_term',
    total_amount: agreement.rent_amount || 0,
    
    // Relationship data - properly mapped from SimpleAgreement
    customers: agreement.customers ? {
      id: agreement.customers.id,
      full_name: agreement.customers.full_name,
      email: agreement.customers.email || '',
      phone_number: agreement.customers.phone_number || '',
      address: agreement.customers.address || '',
      city: agreement.customers.city || '',
      state: agreement.customers.state || '',
      zip_code: agreement.customers.zip_code || '',
      role: agreement.customers.role || 'customer',
      created_at: agreement.customers.created_at || '',
      updated_at: agreement.customers.updated_at || '',
      driver_license: null
    } : undefined,
    vehicles: agreement.vehicles ? {
      ...agreement.vehicles,
      attention_needed_notes: '',
      engine_number: '',
      model_number: '',
      notes: '',
      created_at: '',
      updated_at: '',
      vin: agreement.vehicles.vin || ''
    } : undefined,
    
    // Computed fields for backward compatibility
    customer_name: agreement.customer_name,
    vehicle_info: agreement.vehicle_info
  })) as Agreement[];
}
