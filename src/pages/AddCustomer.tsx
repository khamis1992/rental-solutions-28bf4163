
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { useCustomers } from '@/hooks/use-customers';
import { Customer } from '@/lib/validation-schemas/customer';

const AddCustomer = () => {
  const navigate = useNavigate();
  const { createCustomer } = useCustomers();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Customer) => {
    setIsSubmitting(true);
    try {
      await createCustomer.mutateAsync(data);
      navigate('/customers');
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
