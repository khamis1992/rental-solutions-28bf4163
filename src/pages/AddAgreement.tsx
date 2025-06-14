import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { AgreementOnboardingWizard } from '@/components/agreements/AgreementOnboardingWizard';
import { useAgreements } from '@/hooks/use-agreements';
import { Agreement } from '@/types/agreement';
import { toast } from 'sonner';

const AddAgreement = () => {
  const navigate = useNavigate();
  const { createAgreement } = useAgreements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(true);

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
      />
    </PageContainer>
  );
};

export default AddAgreement;
