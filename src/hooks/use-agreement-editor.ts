
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEditAgreement } from '@/hooks/use-edit-agreement';
import { CustomerInfo } from '@/types/customer';

export function useAgreementEditor() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { agreement, isLoading, vehicleData, customerData } = useEditAgreement(id);

  return {
    id,
    userId: user?.id,
    agreement,
    isLoading,
    vehicleData,
    customerData
  };
}
