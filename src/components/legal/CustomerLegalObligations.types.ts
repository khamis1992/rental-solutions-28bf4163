
export interface CustomerObligation {
  id: string;
  type: string;
  title: string;
  description?: string;
  amount?: number | string;
  dueDate?: Date | string;
  status?: string;
  obligationType?: string; // For backward compatibility
  
  // Additional properties needed by components
  customerId?: string;
  customerName?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  daysOverdue?: number;
  lateFine?: number;
  agreementId?: string;
  agreementNumber?: string;
}
