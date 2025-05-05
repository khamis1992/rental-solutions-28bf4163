
// Define the types used in LegalObligationsService
export type ObligationType = 'payment' | 'traffic_fine' | 'legal_case' | 'document' | 'contract' | 'service';

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

export interface CustomerLegalObligationsProps {
  customerId?: string;
}

// Import and re-export the component to maintain compatibility with existing imports
import { CustomerLegalObligations } from './CustomerLegalObligations.tsx';
export { CustomerLegalObligations };
