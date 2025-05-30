
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
    start_date: new Date(agreement.start_date),
    end_date: new Date(agreement.end_date),
    created_at: new Date(agreement.created_at || new Date()),
    updated_at: new Date(agreement.updated_at || new Date()),
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
