
import React from 'react';
import { Agreement } from '@/types/agreement';
import { AgreementLoadingState } from '@/components/agreements/AgreementLoadingState';
import { CustomerInfo } from '@/types/customer';
import { AgreementEditor } from './AgreementEditor';

interface EditAgreementContentProps {
  id?: string;
  userId?: string;
  agreement: Agreement | null;
  isLoading: boolean;
  vehicleData: any;
  customerData?: CustomerInfo;
}

export function EditAgreementContent(props: EditAgreementContentProps) {
  return (
    <>
      <AgreementLoadingState 
        isLoading={props.isLoading} 
        hasAgreement={!!props.agreement} 
      />
      {!props.isLoading && props.agreement && props.id && props.userId && (
        <AgreementEditor
          agreement={props.agreement}
          id={props.id}
          userId={props.userId}
          vehicleData={props.vehicleData}
          customerData={props.customerData}
        />
      )}
    </>
  );
}
