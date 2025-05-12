
import React from 'react';
import { Agreement } from '@/types/agreement';
import { AgreementLoadingState } from '@/components/agreements/AgreementLoadingState';
import { AgreementEditor } from '@/components/agreements/edit/AgreementEditor';
import { CustomerInfo } from '@/types/customer';
import { adaptAgreementForValidation } from '@/utils/type-adapters';

interface EditAgreementContentProps {
  id?: string;
  userId?: string;
  agreement: Agreement | null;
  isLoading: boolean;
  vehicleData: any;
  customerData?: CustomerInfo;
}

export function EditAgreementContent({ 
  id, 
  userId, 
  agreement, 
  isLoading, 
  vehicleData,
  customerData
}: EditAgreementContentProps) {
  return (
    <>
      <AgreementLoadingState 
        isLoading={isLoading} 
        hasAgreement={!!agreement} 
      />

      {!isLoading && agreement && id && (
        <AgreementEditor
          id={id}
          agreement={agreement}
          userId={userId}
          vehicleData={vehicleData}
          customerData={customerData}
        />
      )}
    </>
  );
}
