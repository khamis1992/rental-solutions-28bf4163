
import React from 'react';
import { Agreement } from '@/types/agreement';
import AgreementForm from '@/components/agreements/AgreementForm';
import { AgreementFormStatus } from '@/components/agreements/AgreementFormStatus';
import { AgreementSubmitHandler } from '@/components/agreements/AgreementSubmitHandler';

interface AgreementEditorProps {
  id: string;
  agreement: Agreement;
  userId?: string;
  vehicleData?: any;
}

export function AgreementEditor({ id, agreement, userId, vehicleData }: AgreementEditorProps) {
  return (
    <AgreementSubmitHandler 
      id={id} 
      agreement={agreement}
      userId={userId}
    >
      {(props) => (
        <>
          <AgreementFormStatus
            updateProgress={props.updateProgress}
            validationErrors={props.validationErrors}
          />
          <AgreementForm 
            initialData={{
              ...agreement,
              vehicles: vehicleData || agreement.vehicles || {},
              customers: agreement.customers || {}
            }} 
            onSubmit={props.handleSubmit}
            isSubmitting={props.isSubmitting}
            validationErrors={props.validationErrors}
          />
        </>
      )}
    </AgreementSubmitHandler>
  );
}
