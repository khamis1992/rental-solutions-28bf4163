
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { agreementSchema, Agreement } from '@/lib/validation-schemas/agreement';
import { CustomerInfo } from '@/types/customer';
import { toast } from 'sonner';

interface UseAgreementFormProps {
  initialData?: Agreement;
  onSubmit: (data: Agreement) => Promise<void>;
  isSubmitting?: boolean;
}

export function useAgreementForm({ initialData, onSubmit, isSubmitting = false }: UseAgreementFormProps) {
  const [termsAccepted, setTermsAccepted] = useState(initialData?.terms_accepted || false);
  const [selectedVehicle, setSelectedVehicle] = useState(null as any);
  const [selectedCustomer, setSelectedCustomer] = useState(null as CustomerInfo | null);

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

  // Update form values when initialData changes
  useEffect(() => {
    if (!initialData) return;

    // Set all form values from initialData
    Object.entries(initialData).forEach(([key, value]) => {
      if (key in form.getValues() && value !== undefined) {
        form.setValue(key as keyof Agreement, value);
      }
    });

    // Set vehicle data if available
    if (initialData.vehicle_id) {
      form.setValue('vehicle_id', initialData.vehicle_id);
      if (initialData.vehicles) {
        setSelectedVehicle(initialData.vehicles);
      }
    }
    
    // Set customer data if available
    if (initialData.customer_id) {
      form.setValue('customer_id', initialData.customer_id);
      if (initialData.customers) {
        const customerData = initialData.customers;
        const customer: CustomerInfo = {
          id: customerData.id || initialData.customer_id,
          full_name: customerData.full_name || '',
          email: customerData.email || '',
          phone_number: customerData.phone_number || '',
          driver_license: customerData.driver_license || '',
          nationality: customerData.nationality || '',
          address: customerData.address || ''
        };
        setSelectedCustomer(customer);
      }
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
        id: initialData?.id
      };
      
      await onSubmit(finalData);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error("Failed to save agreement");
    }
  };

  return {
    form,
    termsAccepted,
    setTermsAccepted,
    selectedVehicle,
    selectedCustomer,
    handleVehicleChange,
    handleCustomerChange,
    handleSubmit,
    isEdit: !!initialData?.id
  };
}
