
import { SimpleAgreement } from '@/hooks/use-agreements';
import { Agreement } from '@/types/agreement';

export function processAgreementData(agreements: any[]): Agreement[] {
  console.log('🔄 processAgreementData called with:', agreements?.length || 0, 'agreements');
  
  if (!agreements || !Array.isArray(agreements)) {
    console.warn('⚠️ processAgreementData: Invalid agreements data provided');
    return [];
  }

  try {
    // Process agreements with better type safety
    return agreements.map((agreement: any): Agreement => {
      // Ensure we have proper default values for required fields
      const processedAgreement: Agreement = {
        // Core database fields
        id: agreement.id,
        agreement_number: agreement.agreement_number || null,
        status: agreement.status || 'draft',
        start_date: agreement.start_date,
        end_date: agreement.end_date,
        rent_amount: Number(agreement.rent_amount) || 0,
        customer_id: agreement.customer_id,
        vehicle_id: agreement.vehicle_id || null,
        payment_frequency: agreement.payment_frequency || null,
        payment_day: agreement.payment_day || null,
        rent_due_day: agreement.rent_due_day || null,
        confirmation_email_sent: Boolean(agreement.confirmation_email_sent),
        daily_late_fee: agreement.daily_late_fee || null,
        deposit_amount: agreement.deposit_amount || null,
        down_payment: agreement.down_payment || null,
        notes: agreement.notes || null,
        created_at: agreement.created_at,
        updated_at: agreement.updated_at,
        agreement_type: agreement.agreement_type || 'short_term',
        
        // Relationship data - handle both nested objects and computed fields
        customers: agreement.customers || agreement.profiles,
        vehicles: agreement.vehicles,
        
        // Computed fields for backward compatibility
        customer_name: agreement.customer_name || agreement.customers?.full_name || agreement.profiles?.full_name || 'Unknown Customer',
        vehicle_info: agreement.vehicle_info || (agreement.vehicles ? 
          `${agreement.vehicles.year || ''} ${agreement.vehicles.make || ''} ${agreement.vehicles.model || ''}`.trim() || 
          agreement.vehicles.license_plate || 'Unknown Vehicle' : 'No Vehicle Assigned'),
        
        // Additional fields
        total_amount: agreement.total_amount || agreement.rent_amount || 0,
        agreement_duration: agreement.agreement_duration || null,
        duration_months: agreement.duration_months || null,
        license_plate: agreement.license_plate || agreement.vehicles?.license_plate || null,
        vehicle_make: agreement.vehicle_make || agreement.vehicles?.make || null,
        vehicle_model: agreement.vehicle_model || agreement.vehicles?.model || null,
        next_payment_date: agreement.next_payment_date || null,
      };

      return processedAgreement;
    });
  } catch (error) {
    console.error('❌ Error in processAgreementData:', error);
    return [];
  }
}
