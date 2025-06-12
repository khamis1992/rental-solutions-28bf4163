
import { Agreement } from '@/types/agreement';

export function processAgreementData(rawAgreements: any[]): Agreement[] {
  return rawAgreements.map(agreement => ({
    ...agreement,
    customer_name: agreement.customers?.full_name || 'Unknown Customer',
    vehicle_info: agreement.vehicles ? `${agreement.vehicles.make} ${agreement.vehicles.model}` : 'No Vehicle'
  }));
}
