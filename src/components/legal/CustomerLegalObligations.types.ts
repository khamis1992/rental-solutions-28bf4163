
export interface CustomerObligation {
  id: string;
  customerId: string;
  obligationType: string;
  amount?: number;
  dueDate: Date | null;
  status: string;
  urgency: string;
  daysOverdue?: number;
  lateFine?: number;
  agreementId?: string;
  type: string;  // Added this missing property
  title: string;  // Added this missing property
}
