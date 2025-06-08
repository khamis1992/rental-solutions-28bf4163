
import { Agreement } from '@/types/agreement';
import { RedesignedAgreementDetail } from './redesigned/RedesignedAgreementDetail';

interface AgreementDetailWrapperProps {
  agreement: Agreement | null;
  onDelete: (id: string) => void;
  rentAmount: number | null;
  contractAmount: number | null;
  onPaymentDeleted: () => void;
  onDataRefresh: () => void;
  onGenerateDocument?: () => void;
}

export function AgreementDetailWrapper(props: AgreementDetailWrapperProps) {
  return <RedesignedAgreementDetail {...props} />;
}
