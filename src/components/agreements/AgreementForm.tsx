
import React from 'react';
import { Form } from '@/components/ui/form';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { useAgreementForm } from '@/hooks/agreement/use-agreement-form';
import { AgreementBasicDetails } from './form/AgreementBasicDetails';
import { AgreementContractTerms } from './form/AgreementContractTerms';
import { VehicleDetailsCard } from './form/VehicleDetailsCard';
import { CustomerInfoDisplay } from './form/CustomerInfoDisplay';
import { AgreementFormActions } from './form/AgreementFormActions';

interface AgreementFormProps {
  initialData?: Agreement;
  onSubmit: (data: Agreement) => Promise<void>;
  isSubmitting?: boolean;
  validationErrors?: Record<string, string> | null;
}

const AgreementForm = ({
  initialData,
  onSubmit,
  isSubmitting = false,
  validationErrors
}: AgreementFormProps) => {
  const {
    form,
    termsAccepted,
    setTermsAccepted,
    selectedVehicle,
    selectedCustomer,
    handleVehicleChange,
    handleCustomerChange,
    handleSubmit,
    isEdit
  } = useAgreementForm({ initialData, onSubmit, isSubmitting });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pb-10">
        <AgreementBasicDetails 
          form={form} 
          isEdit={isEdit} 
          onVehicleChange={handleVehicleChange}
          onCustomerChange={handleCustomerChange} 
        />
        
        {selectedCustomer && (
          <CustomerInfoDisplay customer={selectedCustomer} />
        )}

        {selectedVehicle && (
          <VehicleDetailsCard vehicle={selectedVehicle} />
        )}

        <AgreementContractTerms 
          form={form} 
          termsAccepted={termsAccepted} 
          setTermsAccepted={setTermsAccepted} 
        />

        <AgreementFormActions 
          isSubmitting={isSubmitting}
        />
      </form>
    </Form>
  );
};

export default AgreementForm;
