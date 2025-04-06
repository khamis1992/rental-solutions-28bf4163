
import * as z from 'zod';

export const carInstallmentContractSchema = z.object({
  id: z.string().optional(),
  contract_number: z.string().min(1, { message: 'Contract number is required' }),
  customer_id: z.string().min(1, { message: 'Customer is required' }),
  customer_name: z.string().min(1, { message: 'Customer name is required' }),
  vehicle_id: z.string().optional(),
  vehicle_name: z.string().min(1, { message: 'Vehicle details are required' }),
  start_date: z.string().min(1, { message: 'Start date is required' }),
  end_date: z.string().min(1, { message: 'End date is required' }),
  total_amount: z.number().positive({ message: 'Total amount must be positive' }),
  deposit_amount: z.number().min(0, { message: 'Deposit amount cannot be negative' }).optional(),
  installment_amount: z.number().positive({ message: 'Installment amount must be positive' }).optional(),
  number_of_installments: z.number().int().positive({ message: 'Number of installments must be positive' }).optional(),
  payment_frequency: z.enum(['monthly', 'weekly', 'bi-weekly', 'quarterly']).optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'completed', 'cancelled', 'overdue']).default('active'),
  payments: z.array(
    z.object({
      id: z.string().optional(),
      payment_number: z.string(),
      payment_date: z.union([z.string(), z.date()]),
      due_date: z.union([z.string(), z.date()]),
      amount: z.number().positive(),
      status: z.string(),
      payment_method: z.string().optional(),
      reference: z.string().optional(),
      notes: z.string().optional()
    })
  ).optional()
});

export type CarInstallmentContract = z.infer<typeof carInstallmentContractSchema>;

// Extract just the payment part for reusability
export const carInstallmentPaymentSchema = z.object({
  id: z.string().optional(),
  contract_id: z.string().min(1, { message: 'Contract ID is required' }),
  payment_number: z.string(),
  payment_date: z.union([z.string(), z.date()]),
  due_date: z.union([z.string(), z.date()]),
  amount: z.number().positive({ message: 'Amount must be positive' }),
  status: z.string().default('pending'),
  payment_method: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional()
});

export type CarInstallmentPayment = z.infer<typeof carInstallmentPaymentSchema>;
