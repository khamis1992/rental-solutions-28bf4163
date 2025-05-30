
import { useState } from 'react';
import { useEditAgreement } from './use-edit-agreement';

export function useAgreementEditor(agreementId: string) {
  const {
    agreement,
    isLoading,
    error,
    isSubmitting,
    updateAgreement,
    customerName,
    customerEmail
  } = useEditAgreement(agreementId);

  // Add missing vehicleData and customerData properties
  const vehicleData = agreement?.vehicles || null;
  const customerData = agreement?.customers || null;

  return {
    agreement,
    isLoading,
    error,
    isSubmitting,
    updateAgreement,
    customerName,
    customerEmail,
    vehicleData,
    customerData
  };
}
