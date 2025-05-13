
import React from 'react';
import { Agreement as SchemaAgreement } from '@/lib/validation-schemas/agreement';
import { Agreement as TypeAgreement } from '@/types/agreement';
import AgreementForm from '@/components/agreements/AgreementForm';
import { AgreementFormStatus } from '@/components/agreements/AgreementFormStatus';
import { AgreementSubmitHandler } from '@/components/agreements/AgreementSubmitHandler';
import { CustomerInfo } from '@/types/customer';

interface AgreementEditorProps {
  id: string;
  agreement: TypeAgreement;
  userId?: string;
  vehicleData?: any;
  customerData?: CustomerInfo;
}

export function AgreementEditor({ id, agreement, userId, vehicleData, customerData }: AgreementEditorProps) {
  // Convert the TypeAgreement to SchemaAgreement
  const validationAgreement: SchemaAgreement = {
    ...agreement,
    // Ensure total_amount is set, which is required by SchemaAgreement
    total_amount: agreement.total_amount || 0,
    // Make sure the status is compatible
    status: agreement.status as SchemaAgreement['status']
  };
  
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
            onSubmit={async (data: SchemaAgreement) => {
              await props.handleSubmit(data);
            }}
            isSubmitting={props.isSubmitting}
            validationErrors={props.validationErrors}
          />
        </>
      )}
    </AgreementSubmitHandler>
  );
}
