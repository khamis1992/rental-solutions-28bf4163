
import React from 'react';
import { Loader2 } from 'lucide-react';
import AgreementForm from '../AgreementForm';
import { Agreement } from '@/types/agreement';
import { useEditAgreement } from '@/hooks/use-edit-agreement';
import { useNavigate } from 'react-router-dom';

interface EditAgreementContentProps {
  id: string | undefined;
  userId: string;
  agreement: Agreement | null;
  isLoading: boolean;
  vehicleData: any;
  customerData: any;
}

export function EditAgreementContent({
  id,
  userId,
  agreement,
  isLoading,
  vehicleData,
  customerData
}: EditAgreementContentProps) {
  const navigate = useNavigate();
  const { updateAgreement, isSubmitting } = useEditAgreement(id || '');

  const handleSubmit = async (data: Agreement) => {
    try {
      await updateAgreement(data);
      navigate(`/agreements/${id}`);
    } catch (error) {
      console.error('Failed to update agreement:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="text-center text-muted-foreground">
        Agreement not found
      </div>
    );
  }

  // Convert the agreement to have proper date types for the form
  const agreementForForm: Agreement = {
    ...agreement,
    start_date: typeof agreement.start_date === 'string' ? agreement.start_date : agreement.start_date.toISOString(),
    end_date: typeof agreement.end_date === 'string' ? agreement.end_date : agreement.end_date.toISOString(),
    created_at: typeof agreement.created_at === 'string' ? agreement.created_at : agreement.created_at.toISOString(),
    updated_at: typeof agreement.updated_at === 'string' ? agreement.updated_at : agreement.updated_at.toISOString(),
    // Ensure we have the required fields with proper types
    agreement_type: agreement.agreement_type || 'short_term',
    vehicles: vehicleData,
    customers: customerData
  };

  return (
    <AgreementForm
      initialData={agreementForForm}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
