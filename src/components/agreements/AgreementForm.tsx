
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Agreement } from '@/types/agreement';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { agreementSchema } from '@/lib/validation-schemas/agreement';
import { toast } from 'sonner';
import { AgreementBasicDetails } from './form/AgreementBasicDetails';
import { AgreementContractTerms } from './form/AgreementContractTerms';
import { VehicleDetailsCard } from './form/VehicleDetailsCard';

interface AgreementFormProps {
  initialData?: Agreement;
  onSubmit: (data: Agreement) => Promise<void>;
  isSubmitting?: boolean;
  validationErrors?: Record<string, string> | null;
}

const AgreementForm: React.FC<AgreementFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
  validationErrors
}) => {
  const [termsAccepted, setTermsAccepted] = useState(initialData?.terms_accepted || false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  // Initialize form with default values
  const form = useForm<Agreement>({
    resolver: zodResolver(agreementSchema),
    defaultValues: {
      ...initialData || {
        customer_id: '',
        vehicle_id: '',
        start_date: new Date(),
        end_date: new Date(),
        status: 'draft',
        agreement_number: '',
        total_amount: 0,
        deposit_amount: 0,
        rent_amount: 0,
        daily_late_fee: 120,
        notes: '',
        additional_drivers: [],
      }
    },
  });

  // Make sure to set the ID from initialData
  useEffect(() => {
    if (initialData?.id) {
      form.setValue('id', initialData.id);
    }

    // Ensure rent_amount is correctly set
    if (initialData?.rent_amount) {
      console.log("Setting rent_amount from initialData:", initialData.rent_amount);
      form.setValue('rent_amount', initialData.rent_amount);
    }

    // Set vehicle_id if it exists
    if (initialData?.vehicle_id) {
      console.log("Setting vehicle_id from initialData:", initialData.vehicle_id);
      form.setValue('vehicle_id', initialData.vehicle_id);
      
      // If we have vehicle information, set the selected vehicle
      if (initialData.vehicles) {
        console.log("Setting selected vehicle from initialData:", initialData.vehicles);
        setSelectedVehicle(initialData.vehicles);
      }
    }
  }, [initialData, form]);

  const handleVehicleChange = (vehicleId: string, vehicleData: any) => {
    setSelectedVehicle(vehicleData);
  };

  const handleSubmit = async (data: Agreement) => {
    try {
      if (!termsAccepted) {
        toast.error("You must accept the terms and conditions");
        return;
      }
      
      // We'll handle the terms separately from the form data
      // to avoid sending it to the database
      const finalData = {
        ...data,
        terms_accepted: termsAccepted,
        id: initialData?.id
      };
      
      await onSubmit(finalData);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error("Failed to save agreement");
    }
  };

  const isEdit = !!initialData?.id;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pb-10">
        <AgreementBasicDetails 
          form={form} 
          isEdit={isEdit} 
          onVehicleChange={handleVehicleChange} 
        />

        {selectedVehicle && (
          <VehicleDetailsCard vehicle={selectedVehicle} />
        )}

        <AgreementContractTerms 
          form={form} 
          termsAccepted={termsAccepted} 
          setTermsAccepted={setTermsAccepted} 
        />

        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancel</Button>
          <Button type="submit" className="bg-primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Agreement"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AgreementForm;
