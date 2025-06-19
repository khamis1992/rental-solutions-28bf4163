
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { useAgreementEditor } from '@/hooks/use-agreement-editor';
import { EditAgreementContent } from '@/components/agreements/edit/EditAgreementContent';

const EditAgreement = () => {
  const { id, userId, agreement, isLoading, vehicleData, customerData } = useAgreementEditor();

  return (
    <PageContainer
      title="Edit Agreement"
      description="Modify existing rental agreement details"
      backLink={`/agreements/${id}`}
    >
      <EditAgreementContent
        id={id}
        userId={userId}
        agreement={agreement}
        isLoading={isLoading}
        vehicleData={vehicleData}
        customerData={customerData}
      />
    </PageContainer>
  );
};

export default EditAgreement;
