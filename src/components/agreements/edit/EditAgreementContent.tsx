
import React from 'react';
import { Agreement } from '@/types/agreement';
import { AgreementLoadingState } from '@/components/agreements/AgreementLoadingState';
import { AgreementEditor } from '@/components/agreements/edit/AgreementEditor';

interface EditAgreementContentProps {
  id?: string;
  userId?: string;
  agreement: Agreement | null;
  isLoading: boolean;
  vehicleData: any;
}

export function EditAgreementContent({ 
  id, 
  userId, 
  agreement, 
  isLoading, 
  vehicleData 
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
        />
      )}
    </>
  );
}
