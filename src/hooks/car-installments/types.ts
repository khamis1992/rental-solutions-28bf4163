
// Types shared across car installment hooks
import { 
  CarInstallmentContract, 
  CarInstallmentPayment, 
  ContractFilters, 
  ContractSummary, 
  PaymentFilters, 
  PaymentStatusType 
} from '@/types/car-installment';

export interface UseCarInstallmentContractsResult {
  contracts: CarInstallmentContract[];
  isLoadingContracts: boolean;
  contractFilters: ContractFilters;
  setContractFilters: (filters: ContractFilters) => void;
  fetchContracts: () => void;
  createContract: (newContract: Omit<CarInstallmentContract, 'id' | 'created_at' | 'updated_at'>) => void;
  error?: Error;
}

export interface UseCarInstallmentSummaryResult {
  summary: ContractSummary;
  isLoadingSummary: boolean;
}

export interface UseCarInstallmentPaymentsResult {
  payments: CarInstallmentPayment[];
  isLoadingPayments: boolean;
  selectedContract: string | null;
  setSelectedContract: (id: string | null) => void;
  paymentFilters: PaymentFilters;
  setPaymentFilters: (filters: PaymentFilters) => void;
  fetchContractPayments: (contractId: string) => Promise<CarInstallmentPayment[]>;
  recordPayment: (newPayment: Partial<CarInstallmentPayment>) => void;
  importPayments: (params: { contractId: string, payments: Partial<CarInstallmentPayment>[] }) => void;
  updatePaymentStatus: (
    id: string,
    status: PaymentStatusType,
    paid_amount?: number
  ) => Promise<boolean>;
  addPayment: (newPayment: Partial<CarInstallmentPayment>) => void;
}
