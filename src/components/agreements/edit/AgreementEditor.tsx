
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
    // Ensure all required fields are set
    total_amount: agreement.total_amount || 0,
    rent_amount: agreement.rent_amount || 0,
    // Make sure the status is compatible
    status: agreement.status as SchemaAgreement['status'],
    // Ensure these fields are present even if undefined
    customer_id: agreement.customer_id,
    vehicle_id: agreement.vehicle_id,
    start_date: agreement.start_date,
    end_date: agreement.end_date
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
