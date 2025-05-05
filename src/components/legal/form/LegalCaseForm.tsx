
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { LegalCaseType, LegalCaseStatus, CasePriority } from '@/types/legal-case';
import { useLegalCases } from '@/hooks/legal/useLegalCases';
import { Form } from '@/components/ui/form';
import { toast } from 'sonner';
import { LegalCaseBasicInfo } from './LegalCaseBasicInfo';
import { LegalCaseCaseDetails } from './LegalCaseCaseDetails';
import { LegalCaseDescription } from './LegalCaseDescription';
import { LegalCaseFormActions } from './LegalCaseFormActions';

// Form schema definition
export const legalCaseFormSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  case_type: z.nativeEnum(LegalCaseType, {
    required_error: 'Please select a case type',
  }),
  description: z.string().optional(),
  amount_owed: z.coerce.number().min(0, 'Amount must be a positive number').optional(),
  priority: z.nativeEnum(CasePriority).optional(),
  status: z.nativeEnum(LegalCaseStatus).optional(),
  assigned_to: z.string().optional(),
});

export type LegalCaseFormValues = z.infer<typeof legalCaseFormSchema>;

export interface LegalCaseFormProps {
  onCancel?: () => void;
}

const LegalCaseForm: React.FC<LegalCaseFormProps> = ({ onCancel }) => {
  const navigate = useNavigate();
  const { createLegalCase, caseTypes, caseStatuses, casePriorities } = useLegalCases();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const form = useForm<LegalCaseFormValues>({
    resolver: zodResolver(legalCaseFormSchema),
    defaultValues: {
      customer_id: '',
      case_type: LegalCaseType.PAYMENT_DEFAULT,
      description: '',
      amount_owed: 0,
      priority: CasePriority.MEDIUM,
      status: LegalCaseStatus.PENDING,
      assigned_to: '',
    },
  });
  
  const handleSubmit = async (data: LegalCaseFormValues) => {
    try {
      setIsSubmitting(true);
      
      await createLegalCase({
        ...data,
        amount_owed: data.amount_owed || 0,
      });
      
      toast.success('Legal case created successfully');
      navigate('/legal');
    } catch (error) {
      console.error('Error creating case:', error);
      toast.error('Failed to create legal case');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/legal');
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LegalCaseBasicInfo form={form} />
          <LegalCaseCaseDetails 
            form={form} 
            caseTypes={caseTypes} 
            casePriorities={casePriorities} 
            caseStatuses={caseStatuses} 
          />
        </div>
        
        <LegalCaseDescription form={form} />
        
        <LegalCaseFormActions 
          onCancel={handleCancel}
          isSubmitting={isSubmitting} 
        />
      </form>
    </Form>
  );
};

export default LegalCaseForm;
