
// Define the types used in LegalObligationsService
export type ObligationType = 'payment' | 'traffic_fine' | 'legal_case';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface CustomerObligation {
  id: string;
  customerId: string;
  customerName: string;
  obligationType: ObligationType;
  amount: number;
  dueDate: Date;
  description: string;
  urgency: UrgencyLevel;
  status: string;
  daysOverdue: number;
  agreementId?: string;
  agreementNumber?: string;
  lateFine?: number;
}

// Export the CustomerLegalObligations component
import React from 'react';
import LegalObligationsTab from './LegalObligationsTab';

interface CustomerLegalObligationsProps {
  customerId: string;
}

export function CustomerLegalObligations({ customerId }: CustomerLegalObligationsProps) {
  return <LegalObligationsTab customerId={customerId} />;
}

export default CustomerLegalObligations;
