
import { Agreement } from '@/types/agreement';

/**
 * Helper to convert from simple to full agreement
 */
export function adaptSimpleToFullAgreement(simpleAgreement: any): Agreement {
  return {
    ...simpleAgreement,
    additional_drivers: simpleAgreement.additional_drivers || [],
    terms_accepted: !!simpleAgreement.terms_accepted,
  };
}
