
// This file now serves as a compatibility layer for existing imports
// All functionality has been moved to separate files in the agreement/ directory

export type { Agreement, AgreementStatus } from './agreement/types';
export { AGREEMENT_STATUS_VALUES, AGREEMENT_STATUS_OPTIONS } from './agreement/constants';
export { agreementSchema } from './agreement/schema';
export { forceGeneratePaymentForAgreement } from './agreement/payment-utils';
