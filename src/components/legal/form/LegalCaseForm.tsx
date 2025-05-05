
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LegalCaseBasicInfo } from './LegalCaseBasicInfo';
import { LegalCaseCaseDetails } from './LegalCaseCaseDetails';
import { LegalCaseDescription } from './LegalCaseDescription';
import { LegalCaseFormActions } from './LegalCaseFormActions';

// Define the LegalCase type
export type LegalCase = {
  id: string;
  customer_id: string;
  case_type: string;
  description?: string;
  amount_owed: number;
  status: string;
  priority: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolution_notes?: string;
  resolution_date?: string;
};

// Define case priority and status types
export type CasePriority = 'low' | 'medium' | 'high' | 'urgent';
export type LegalCaseStatus = 'pending_reminder' | 'reminder_sent' | 'escalated' | 'in_progress' | 'resolved' | 'closed';
export type LegalCaseType = 'payment_default' | 'contract_breach' | 'property_damage' | 'insurance_claim' | 'other';

// Define form schema
const formSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  case_type: z.string().optional(),
  description: z.string().optional(),
  amount_owed: z.number().min(0, "Amount must be a positive number"),
  status: z.string().min(1, "Status is required"),
  priority: z.string().min(1, "Priority is required"),
  assigned_to: z.string().optional(),
});

type LegalCaseFormProps = {
  onSubmit?: (data: LegalCase) => void;
  initialValues?: Partial<LegalCase>;
  isEdit?: boolean;
};

export const LegalCaseForm: React.FC<LegalCaseFormProps> = ({ 
  onSubmit, 
  initialValues = {}, 
  isEdit = false 
}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: initialValues.customer_id || "",
      case_type: initialValues.case_type || "payment_default",
      description: initialValues.description || "",
      amount_owed: initialValues.amount_owed || 0,
      status: initialValues.status || "pending_reminder",
      priority: initialValues.priority || "medium",
      assigned_to: initialValues.assigned_to || "",
    },
  });

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Convert form values to LegalCase format
      const legalCaseData = {
        amount_owed: values.amount_owed,
        priority: values.priority as CasePriority,
        status: values.status as LegalCaseStatus,
        customer_id: values.customer_id,
        description: values.description,
        assigned_to: values.assigned_to,
        case_type: values.case_type as LegalCaseType,
      } as LegalCase;
      
      if (onSubmit) {
        onSubmit(legalCaseData);
      } else {
        // Implement default submission logic here if needed
        toast.success(isEdit ? "Case updated successfully" : "New case created successfully");
        navigate("/legal");
      }
    } catch (error) {
      toast.error("An error occurred while saving the case");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Legal Case" : "New Legal Case"}</CardTitle>
        <CardDescription>
          {isEdit 
            ? "Update the details of this legal case" 
            : "Create a new legal case by filling out the details below"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <LegalCaseBasicInfo form={form} />
            <LegalCaseCaseDetails form={form} />
            <LegalCaseDescription form={form} />
            <LegalCaseFormActions isSubmitting={isSubmitting} isEdit={isEdit} />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default LegalCaseForm;
