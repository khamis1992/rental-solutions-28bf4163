
import { Agreement } from '@/types/agreement';

export function processAgreementData(rawAgreements: any[]): Agreement[] {
  return rawAgreements.map((agreement: any): Agreement => ({
    id: agreement.id,
    agreement_number: agreement.agreement_number,
    status: agreement.status,
    start_date: agreement.start_date,
    end_date: agreement.end_date,
    rent_amount: agreement.rent_amount,
    customer_id: agreement.customer_id ?? undefined,
    vehicle_id: agreement.vehicle_id ?? undefined,
    payment_frequency: agreement.payment_frequency ?? 'monthly',
    payment_day: agreement.payment_day ?? undefined,
    rent_due_day: agreement.rent_due_day ?? undefined,
    confirmation_email_sent: agreement.confirmation_email_sent ?? false,
    daily_late_fee: agreement.daily_late_fee ?? undefined,
    deposit_amount: agreement.deposit_amount ?? undefined,
    down_payment: agreement.down_payment ?? 0,
    notes: agreement.notes ?? undefined,
    created_at: agreement.created_at,
    updated_at: agreement.updated_at,
    agreement_type: agreement.agreement_type ?? 'short_term',
    total_amount: agreement.total_amount ?? 0,
    terms_accepted: agreement.terms_accepted ?? false,
    additional_drivers: agreement.additional_drivers ?? [],
    customers: agreement.customers,
    vehicles: agreement.vehicles,
    customer_name: agreement.customer_name,
    vehicle_info: agreement.vehicle_info
  }));
}
