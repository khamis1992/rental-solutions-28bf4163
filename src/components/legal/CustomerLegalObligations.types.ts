
export interface CustomerObligation {
  id: string;
  type: string;
  title: string;
  description: string;
  dueDate: Date | null;
  amount?: number;
  status: string;
  customerId?: string;
  agreementId?: string;
  agreementNumber?: string;
  obligationType: "payment" | "document" | "legal";
  urgency: "low" | "medium" | "high" | "critical";
  daysOverdue?: number;
  lateFine?: number;
}

export interface CustomerObligationsProps {
  customerId?: string;
  agreementId?: string;
  showHeader?: boolean;
  limit?: number;
}
