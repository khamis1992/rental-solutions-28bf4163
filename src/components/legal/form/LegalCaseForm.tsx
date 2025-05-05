
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { LegalCaseBasicInfo } from './LegalCaseBasicInfo';
import { LegalCaseCaseDetails } from './LegalCaseCaseDetails';
import { LegalCaseDescription } from './LegalCaseDescription';
import { LegalCaseFormActions } from './LegalCaseFormActions';

// Export the form values interface so it can be imported by other components
export interface LegalCaseFormValues {
  status?: string;
  customer_id?: string;
  description?: string;
  amount_owed?: number;
  assigned_to?: string;
  case_type?: string;
  priority?: string;
}

export interface LegalCaseFormProps {
  initialData?: LegalCaseFormValues;
  onSubmit: (data: LegalCaseFormValues) => void;
  isSubmitting?: boolean;
  isEdit?: boolean;
}

export interface LegalCaseCaseDetailsProps {
  form: ReturnType<typeof useForm<LegalCaseFormValues>>;
  caseTypes: { value: string; label: string }[];
  casePriorities: { value: string; label: string }[];
  caseStatuses: { value: string; label: string }[];
}

export interface LegalCaseFormActionsProps {
  isSubmitting: boolean;
  isEdit: boolean;
}

export const LegalCaseForm: React.FC<LegalCaseFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
  isEdit = false,
}) => {
  const form = useForm<LegalCaseFormValues>({
    defaultValues: {
      status: initialData?.status || 'pending',
      customer_id: initialData?.customer_id || '',
      description: initialData?.description || '',
      amount_owed: initialData?.amount_owed || 0,
      assigned_to: initialData?.assigned_to || '',
      case_type: initialData?.case_type || '',
      priority: initialData?.priority || 'medium',
    },
  });

  const handleSubmit = (data: LegalCaseFormValues) => {
    onSubmit(data);
  };

  // Define options for select inputs
  const caseTypes = [
    { value: 'payment_default', label: 'Payment Default' },
    { value: 'contract_breach', label: 'Contract Breach' },
    { value: 'vehicle_damage', label: 'Vehicle Damage' },
    { value: 'traffic_violations', label: 'Traffic Violations' },
    { value: 'insurance_dispute', label: 'Insurance Dispute' },
  ];

  const casePriorities = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  const caseStatuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'active', label: 'Active' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <LegalCaseBasicInfo form={form} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <LegalCaseCaseDetails 
              form={form} 
              caseTypes={caseTypes} 
              casePriorities={casePriorities}
              caseStatuses={caseStatuses}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <LegalCaseDescription form={form} />
          </CardContent>
          <CardFooter className="border-t bg-muted/50 px-6">
            <LegalCaseFormActions 
              isSubmitting={isSubmitting} 
              isEdit={isEdit}
            />
          </CardFooter>
        </Card>
      </div>
    </form>
  );
};

export default LegalCaseForm;
