
import React from 'react';
import { useParams } from 'react-router-dom';
import AgreementForm from '@/components/agreements/AgreementForm';
import PageContainer from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useEditAgreement } from '@/hooks/use-edit-agreement';
import { AgreementSubmitHandler } from '@/components/agreements/AgreementSubmitHandler';
import { AgreementFormStatus } from '@/components/agreements/AgreementFormStatus';
import { AgreementLoadingState } from '@/components/agreements/AgreementLoadingState';

const EditAgreement = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { agreement, isLoading, vehicleData } = useEditAgreement(id);

  return (
    <PageContainer
      title="Edit Agreement"
      description="Modify existing rental agreement details"
      backLink={`/agreements/${id}`}
    >
      <AgreementLoadingState 
        isLoading={isLoading} 
        hasAgreement={!!agreement} 
      />

      {!isLoading && agreement && (
        <AgreementSubmitHandler 
          id={id!} 
          agreement={agreement}
          userId={user?.id}
        >
          {({ handleSubmit, isSubmitting, updateProgress, validationErrors }) => (
            <>
              <AgreementFormStatus
                updateProgress={updateProgress}
                validationErrors={validationErrors}
              />
              <AgreementForm 
                initialData={{
                  ...agreement,
                  vehicles: vehicleData || agreement.vehicles
                }} 
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                validationErrors={validationErrors}
              />
            </>
          )}
        </AgreementSubmitHandler>
      )}
    </PageContainer>
  );
};

export default EditAgreement;
