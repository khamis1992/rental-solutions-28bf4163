
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface PaymentScheduleData {
  agreementId: string;
  schedule: {
    due_date: string;
    amount: number;
  }[];
}

export function usePaymentScheduleMutation() {
  return useMutation({
    mutationFn: async (data: PaymentScheduleData) => {
      const response = await fetch('/api/payment-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Payment schedule saved successfully');
    },
    onError: (error) => {
      console.error('Error saving payment schedule:', error);
      toast.error('Failed to save payment schedule');
    },
  });
}
