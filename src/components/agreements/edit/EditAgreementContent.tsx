
import React from 'react';
import { Agreement } from '@/types/agreement';
import { CustomerInfo } from '@/types/customer';
import { AgreementLoadingState } from '@/components/agreements/AgreementLoadingState';
import AgreementEditor from '@/components/agreements/edit/AgreementEditor';

interface EditAgreementContentProps {
  id?: string;
  userId?: string;
  agreement: Agreement | null;
  isLoading: boolean;
  vehicleData?: any;
  customerData?: CustomerInfo;
}

export function EditAgreementContent({ 
  id,
  userId,
  agreement,
  isLoading
}: EditAgreementContentProps) {
  return (
    <>
      <AgreementLoadingState 
        isLoading={isLoading} 
        hasAgreement={!!agreement} 
      />

      {!isLoading && agreement && id && <AgreementEditor />}
      {!isLoading && !agreement && <AgreementEditor />}
    </>
  );
}
