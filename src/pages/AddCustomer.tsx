
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageContainer from '@/components/layout/PageContainer';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { useCustomers } from '@/hooks/use-customers';
import { Customer } from '@/lib/validation-schemas/customer';
import { toast } from 'sonner';

const AddCustomer = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { createCustomer } = useCustomers();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Customer) => {
    setIsSubmitting(true);
    try {
      await createCustomer.mutateAsync(data);
      toast(t('customers.statusUpdateSuccess'));
      navigate('/customers');
    } catch (error) {
      console.error('Error creating customer:', error);
      toast(t('customers.statusUpdateFailed'), {
        description: error instanceof Error ? error.message : t('customers.unexpectedError')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title={t('customers.addCustomer')}
      description={t('customers.description')}
      backLink="/customers"
    >
      <CustomerForm onSubmit={handleSubmit} isLoading={isSubmitting} />
    </PageContainer>
  );
};

export default AddCustomer;
