import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { CustomerOnboardingWizard } from '@/components/customers/CustomerOnboardingWizard';
import { useCustomers } from '@/hooks/use-customers';
import { useAgreements } from '@/hooks/use-agreements';
import { toast } from 'sonner';

const AddCustomer = () => {
  const navigate = useNavigate();
  const { createCustomer } = useCustomers();
  const { createAgreement } = useAgreements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(true);

  const handleSubmit = async (customerData: any, agreementData?: any) => {
    setIsSubmitting(true);
    try {
      // Create customer first
      const newCustomer = await createCustomer.mutateAsync(customerData);
      toast.success('تم إنشاء العميل بنجاح');
      
      // If create_agreement flag is set, redirect to agreement creation page
      if (agreementData && agreementData.create_agreement) {
        toast.info('سيتم توجيهك لصفحة إنشاء اتفاقية جديدة');
        navigate(`/agreements/add?customer_id=${newCustomer.id}`);
      } else {
        navigate('/customers');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('فشل في إنشاء العميل');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setWizardOpen(false);
    navigate('/customers');
  };

  return (
    <PageContainer
      title="إضافة عميل جديد"
      description="إضافة عميل جديد إلى النظام مع إمكانية إنشاء اتفاقية مباشرة."
      backLink="/customers"
    >
      <CustomerOnboardingWizard
        open={wizardOpen}
        onClose={handleClose}
        onComplete={handleSubmit}
      />
    </PageContainer>
  );
};

export default AddCustomer;
