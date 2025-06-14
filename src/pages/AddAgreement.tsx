import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { AgreementOnboardingWizard } from '@/components/agreements/AgreementOnboardingWizard';
import { useAgreements } from '@/hooks/use-agreements';
import { useCustomers } from '@/hooks/use-customers';
import { Agreement } from '@/types/agreement';
import { toast } from 'sonner';

const AddAgreement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createAgreement } = useAgreements();
  const { data: customers = [] } = useCustomers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(true);
  const [preSelectedCustomer, setPreSelectedCustomer] = useState<string | null>(null);

  // Check for customer_id in URL parameters
  useEffect(() => {
    const customerId = searchParams.get('customer_id');
    if (customerId && customers.length > 0) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        setPreSelectedCustomer(customerId);
        toast.success(`تم تحديد العميل: ${customer.full_name}`);
      }
    }
  }, [searchParams, customers]);

  const handleSubmit = async (data: Agreement) => {
    setIsSubmitting(true);
    try {
      await createAgreement.mutateAsync(data);
      toast('تم إنشاء الاتفاقية بنجاح');
      navigate('/agreements');
    } catch (error) {
      console.error('Error creating agreement:', error);
      toast('فشل في إنشاء الاتفاقية', {
        description: error instanceof Error ? error.message : 'حدث خطأ غير معروف'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setWizardOpen(false);
    navigate('/agreements');
  };

  return (
    <PageContainer
      title="إنشاء اتفاقية جديدة"
      description="إنشاء اتفاقية إيجار جديدة خطوة بخطوة."
      backLink="/agreements"
    >
      <AgreementOnboardingWizard
        open={wizardOpen}
        onClose={handleClose}
        onComplete={handleSubmit}
        preSelectedCustomerId={preSelectedCustomer}
      />
    </PageContainer>
  );
};

export default AddAgreement;
