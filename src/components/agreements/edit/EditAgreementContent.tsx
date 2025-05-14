import React from 'react';
import { Agreement } from '@/types/agreement';
import { AgreementLoadingState } from '@/components/agreements/AgreementLoadingState';
import { CustomerInfo } from '@/types/customer';
import AgreementEditorComponent from './AgreementEditor';

interface EditAgreementContentProps {
  id?: string;
  userId?: string;
  agreement: Agreement | null;
  isLoading: boolean;
  vehicleData: any;
  customerData?: CustomerInfo;
}

export const AgreementEditor: React.FC<EditAgreementContentProps> = ({ 
  id, 
  userId, 
  agreement, 
  isLoading, 
  vehicleData,
  customerData
}) => {
  return (
    <div>
      {/* Your agreement editor content here */}
      {/* Example: */}
      {agreement ? (
        <div>
          <h2>Edit Agreement</h2>
          {/* Display agreement details and form elements for editing */}
          <p>Agreement ID: {id}</p>
          {/* Add form elements to edit agreement properties */}
        </div>
      ) : (
        <p>No agreement data available.</p>
      )}
    </div>
  );
};

export function EditAgreementContent(props: EditAgreementContentProps) {
  return (
    <>
      <AgreementLoadingState 
        isLoading={props.isLoading} 
        hasAgreement={!!props.agreement} 
      />
      {!props.isLoading && props.agreement && props.id && props.userId && (
        <AgreementEditorComponent
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
