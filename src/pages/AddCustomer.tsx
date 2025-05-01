
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { useCustomers } from '@/hooks/use-customers';
import { Customer } from '@/lib/validation-schemas/customer';
import { toast } from 'sonner';
import { logOperation } from '@/utils/monitoring-utils';

const AddCustomer = () => {
  const navigate = useNavigate();
  const { createCustomer } = useCustomers();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Customer) => {
    setIsSubmitting(true);
    try {
      await createCustomer.mutateAsync(data);
      toast('Customer added successfully');
      navigate('/customers');
    } catch (error) {
      logOperation(
        'customer.create', 
        'error', 
        { error: error instanceof Error ? error.message : String(error) },
        'Error creating customer'
      );
      toast('Failed to create customer', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="Add New Customer"
      description="Create a new customer record in the system."
      backLink="/customers"
    >
      <CustomerForm onSubmit={handleSubmit} isLoading={isSubmitting} />
    </PageContainer>
  );
};

export default AddCustomer;
