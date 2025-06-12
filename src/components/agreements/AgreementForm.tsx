import { useState, useEffect } from 'react';
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
import CustomerSection from './CustomerSection';
import { CustomerInfo } from '@/types/customer';
import { agreementPaymentService } from '@/services/AgreementPaymentService';

interface AgreementFormProps {
  initialData?: Agreement;
  onSubmit: (data: Agreement) => Promise<void>;
  isSubmitting?: boolean;
}

const AgreementForm = ({
  initialData,
  onSubmit,
  isSubmitting = false
}: AgreementFormProps) => {
  const [termsAccepted, setTermsAccepted] = useState(initialData?.terms_accepted || false);
  const [selectedVehicle, setSelectedVehicle] = useState(null as any);
  const [selectedCustomer, setSelectedCustomer] = useState(null as CustomerInfo | null);

  // Initialize form with default values, ensuring proper date handling
  const form = useForm<Agreement>({
    resolver: zodResolver(agreementSchema),
    defaultValues: {
      ...initialData || {
        id: '',
        customer_id: '',
        vehicle_id: '',
        start_date: new Date().toISOString(),
        end_date: new Date().toISOString(),
        status: 'draft',
        agreement_number: '',
        total_amount: 0,
        deposit_amount: 0,
        rent_amount: 0,
        daily_late_fee: 120,
        notes: '',
        additional_drivers: [],
        payment_frequency: 'monthly',
        payment_day: 1,
        down_payment: 0,
        confirmation_email_sent: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        agreement_type: 'short_term',
        terms_accepted: false
      }
    },
  });

  // Set form values from initialData
  useEffect(() => {
    if (initialData?.id) {
      form.setValue('id', initialData.id);
    }

    if (initialData?.rent_amount) {
      console.log("Setting rent_amount from initialData:", initialData.rent_amount);
      form.setValue('rent_amount', initialData.rent_amount);
    }

    if (initialData?.vehicle_id) {
      console.log("Setting vehicle_id from initialData:", initialData.vehicle_id);
      form.setValue('vehicle_id', initialData.vehicle_id);
      
      if (initialData.vehicles) {
        console.log("Setting selected vehicle from initialData:", initialData.vehicles);
        setSelectedVehicle(initialData.vehicles);
      }
    }
    
    if (initialData?.customer_id) {
      console.log("Setting customer_id from initialData:", initialData.customer_id);
      form.setValue('customer_id', initialData.customer_id);
      
      if (initialData.customers) {
        const customerData = initialData.customers;
        console.log("Setting selected customer from initialData:", customerData);
        
        const customer: CustomerInfo = {
          id: customerData.id || initialData.customer_id,
          full_name: customerData.full_name || '',
          email: customerData.email || '',
          phone_number: customerData.phone_number || '',
          driver_license: (customerData as any).driver_license || '',
          nationality: (customerData as any).nationality || '',
          address: customerData.address || '',
          city: (customerData as any).city || '',
          state: (customerData as any).state || '',
          zip_code: (customerData as any).zip_code || '',
          role: (customerData as any).role || '',
          created_at: (customerData as any).created_at || '',
          updated_at: (customerData as any).updated_at || ''
        };
        
        setSelectedCustomer(customer);
      }
    }

    if (initialData?.total_amount) {
      console.log("Setting total_amount from initialData:", initialData.total_amount);
      form.setValue('total_amount', initialData.total_amount);
    }

    if (initialData?.deposit_amount) {
      console.log("Setting deposit_amount from initialData:", initialData.deposit_amount);
      form.setValue('deposit_amount', initialData.deposit_amount);
    }

    if (initialData?.daily_late_fee) {
      console.log("Setting daily_late_fee from initialData:", initialData.daily_late_fee);
      form.setValue('daily_late_fee', initialData.daily_late_fee);
    }

    if (initialData?.notes) {
      console.log("Setting notes from initialData:", initialData.notes);
      form.setValue('notes', initialData.notes);
    }

    if (initialData?.agreement_number) {
      form.setValue('agreement_number', initialData.agreement_number);
    }
  }, [initialData, form]);

  const handleVehicleChange = (vehicleId: string, vehicleData: any) => {
    console.log("Vehicle changed:", vehicleId, vehicleData);
    setSelectedVehicle(vehicleData);
    form.setValue('vehicle_id', vehicleId);
  };

  const handleCustomerChange = (customerId: string, customerData: CustomerInfo) => {
    console.log("Customer changed:", customerId, customerData);
    setSelectedCustomer(customerData);
    form.setValue('customer_id', customerId);
  };

  const handleSubmit = async (data: Agreement) => {
    try {
      if (!termsAccepted) {
        toast.error("You must accept the terms and conditions");
        return;
      }
      
      const finalData = {
        ...data,
        terms_accepted: termsAccepted,
        id: initialData?.id || data.id || ''
      };
      
      console.log('Submitting agreement data:', finalData);
      
      // Call the parent onSubmit function first
      await onSubmit(finalData);

      // Only generate payment schedule for NEW agreements (not edits)
      if (!initialData?.id && finalData.id) {
        console.log('Creating payment schedule for new agreement:', finalData.id);
        
        try {
          const result = await agreementPaymentService.createPaymentScheduleForAgreement(finalData);
          
          if (result.success) {
            console.log(`Payment schedule created successfully: ${result.scheduleCount} schedule items, ${result.paymentCount} payment records`);
            toast.success(`Agreement and payment schedule created successfully (${result.paymentCount} payments)`);
          } else {
            console.error('Failed to create payment schedule:', result.error);
            toast.warning(`Agreement created but payment schedule creation failed: ${result.error}`);
          }
        } catch (scheduleError) {
          console.error('Error creating payment schedule:', scheduleError);
          toast.warning(`Agreement created but payment schedule creation failed: ${scheduleError instanceof Error ? scheduleError.message : 'Unknown error'}`);
        }
      }
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
          onCustomerChange={handleCustomerChange} 
        />
        
        {selectedCustomer && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Customer Information</h3>
            <CustomerSection customer={selectedCustomer} />
          </div>
        )}

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
