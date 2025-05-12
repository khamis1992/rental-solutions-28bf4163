
import React from 'react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import AgreementForm from '@/components/agreements/AgreementForm';
import { AgreementFormStatus } from '@/components/agreements/AgreementFormStatus';
import { AgreementSubmitHandler } from '@/components/agreements/AgreementSubmitHandler';
import { CustomerInfo } from '@/types/customer';
import { adaptAgreementForValidation } from '@/utils/type-adapters';

interface AgreementEditorProps {
  id: string;
  agreement: Agreement;
  userId?: string;
  vehicleData?: any;
  customerData?: CustomerInfo;
}

export function AgreementEditor({ id, agreement, userId, vehicleData, customerData }: AgreementEditorProps) {
  // Adapt the agreement to use the validation-compatible format
  const validationAgreement = adaptAgreementForValidation(agreement);
  
  return (
    <AgreementSubmitHandler 
      id={id} 
      agreement={validationAgreement}
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
              ...validationAgreement,
              vehicles: vehicleData || validationAgreement.vehicles || {},
              customers: customerData || validationAgreement.customers || {}
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
