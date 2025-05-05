
import React from 'react';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { LegalCaseBasicInfo } from './LegalCaseBasicInfo';
import { LegalCaseCaseDetails } from './LegalCaseCaseDetails';
import { LegalCaseDescription } from './LegalCaseDescription';
import { LegalCaseFormActions } from './LegalCaseFormActions';

// Define form values interface that can be shared across components
export interface LegalCaseFormValues {
  customer_id?: string;
  amount_owed?: number;
  assigned_to?: string;
  case_type?: string;
  description?: string;
  priority?: string;
  status?: string;
}

// Props interface for the form
interface LegalCaseFormProps {
  onSubmit: (data: LegalCaseFormValues) => void;
  isSubmitting?: boolean;
  isEdit?: boolean;
  initialData?: LegalCaseFormValues;
  onCancel?: () => void;
  caseTypes?: string[];
  casePriorities?: string[];
  caseStatuses?: string[];
}

// Props for case details component
export interface LegalCaseCaseDetailsProps {
  form: any;
  caseTypes: string[];
  casePriorities: string[];
  caseStatuses: string[];
}

export const LegalCaseForm: React.FC<LegalCaseFormProps> = ({ 
  onSubmit, 
  isSubmitting = false, 
  isEdit = false,
  initialData,
  onCancel,
  caseTypes = [],
  casePriorities = [],
  caseStatuses = []
}) => {
  const form = useForm<LegalCaseFormValues>({
    defaultValues: initialData || {
      customer_id: '',
      amount_owed: 0,
      assigned_to: '',
      case_type: '',
      description: '',
      priority: 'medium',
      status: 'pending_reminder'
    }
  });

  const handleSubmit = async (data: LegalCaseFormValues) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-6">
          <LegalCaseBasicInfo form={form} />
          
          <LegalCaseCaseDetails 
            form={form} 
            caseTypes={caseTypes}
            casePriorities={casePriorities}
            caseStatuses={caseStatuses}
          />
          
          <LegalCaseDescription form={form} />
          
          <LegalCaseFormActions 
            onCancel={onCancel || (() => {})} 
            isSubmitting={isSubmitting} 
          />
        </div>
      </form>
    </Form>
  );
};

export default LegalCaseForm;
