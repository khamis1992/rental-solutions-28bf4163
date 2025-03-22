export interface PaymentHistoryProps {
  payments: Payment[];
  isLoading: boolean;
  rentAmount?: number | null;
}
