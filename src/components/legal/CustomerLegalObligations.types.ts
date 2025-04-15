
export interface CustomerObligation {
  id: string;
  type: string;
  title: string;
  description?: string;
  amount?: number | string;
  dueDate?: Date | string;
  status?: string;
  obligationType?: string; // For backward compatibility
}
