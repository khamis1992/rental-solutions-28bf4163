import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { CustomerOnboardingWizard } from '@/components/customers/CustomerOnboardingWizard';
import { useCustomers } from '@/hooks/use-customers';
import { Customer } from '@/lib/validation-schemas/customer';
import { toast } from 'sonner';

const AddCustomer = () => {
  const navigate = useNavigate();
  const { createCustomer } = useCustomers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(true);

  const handleSubmit = async (data: Customer) => {
    setIsSubmitting(true);
    try {
      await createCustomer.mutateAsync(data);
      toast('تم إضافة العميل بنجاح');
      navigate('/customers');
    } catch (error) {
      console.error('Error creating customer:', error);
      toast('فشل في إنشاء العميل', {
        description: error instanceof Error ? error.message : 'حدث خطأ غير معروف'
      });
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
      description="إنشاء سجل عميل جديد في النظام."

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
