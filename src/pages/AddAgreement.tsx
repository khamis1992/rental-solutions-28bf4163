
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AgreementFormWithVehicleCheck from '@/components/agreements/AgreementFormWithVehicleCheck';
import PageContainer from '@/components/layout/PageContainer';
import { useAgreements } from '@/hooks/use-agreements';
import type { Agreement } from '@/lib/validation-schemas/agreement';

const AddAgreement = () => {
  const navigate = useNavigate();
  const { createAgreement } = useAgreements();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateAgreement = async (agreementData: Agreement) => {
    try {
      setIsSubmitting(true);
      
      // Convert date objects to ISO strings for database storage
      const formattedData = {
        ...agreementData,
        start_date: agreementData.start_date instanceof Date 
          ? agreementData.start_date.toISOString() 
          : agreementData.start_date,
        end_date: agreementData.end_date instanceof Date 
          ? agreementData.end_date.toISOString() 
          : agreementData.end_date
      };
      
      await createAgreement.mutateAsync(formattedData);
      toast.success('Agreement created successfully');
      navigate('/agreements');
    } catch (error) {
      console.error('Error creating agreement:', error);
      toast.error('Failed to create agreement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="Add Agreement"
      description="Create a new rental agreement"
      backLink="/agreements"
    >
      <AgreementFormWithVehicleCheck
        onSubmit={handleCreateAgreement}
        isSubmitting={isSubmitting}
      />
    </PageContainer>
  );
};

export default AddAgreement;
