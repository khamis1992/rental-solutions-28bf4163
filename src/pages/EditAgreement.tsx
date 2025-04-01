
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import AgreementFormWithVehicleCheck from "@/components/agreements/AgreementFormWithVehicleCheck";
import { useAgreements } from '@/hooks/use-agreements';
import { toast } from 'sonner';

const formSchema = z.object({
  agreement_number: z.string().min(1, "Agreement number is required"),
  start_date: z.date(),
  end_date: z.date(),
  customer_id: z.string().min(1, "Customer is required"),
  vehicle_id: z.string().min(1, "Vehicle is required"),
  status: z.enum(["draft", "active", "pending", "expired", "cancelled", "closed"]),
  rent_amount: z.number().positive("Rent amount must be positive"),
  deposit_amount: z.number().nonnegative("Deposit amount must be non-negative"),
  total_amount: z.number().positive("Total amount must be positive"),
  daily_late_fee: z.number().nonnegative("Daily late fee must be non-negative"),
  agreement_duration: z.string().optional(),
  notes: z.string().optional(),
  terms_accepted: z.boolean().default(false),
});

const EditAgreement = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getAgreement, updateAgreement } = useAgreements();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      agreement_number: '',
      start_date: new Date(),
      end_date: new Date(),
      customer_id: '',
      vehicle_id: '',
      status: 'draft',
      rent_amount: 0,
      deposit_amount: 0,
      total_amount: 0,
      daily_late_fee: 0,
      agreement_duration: '',
      notes: '',
      terms_accepted: false,
    },
  });

  useEffect(() => {
    const fetchAgreement = async () => {
      if (!id) return;
      
      const agreement = await getAgreement(id);
      if (agreement) {
        form.reset(agreement);
      } else {
        toast.error("Failed to load agreement details");
      }
    };

    fetchAgreement();
  }, [id, getAgreement, form]);

  const onSubmit = async (data) => {
    if (!id) return;
    
    await updateAgreement.mutateAsync({ id, data });
    navigate('/agreements');
  };

  // The function to navigate back after save
  const handleAfterSave = () => {
    navigate('/agreements');
  };

  return (
    <div>
      <h1>Edit Agreement</h1>
      <AgreementFormWithVehicleCheck
        onSubmit={onSubmit}
        isSubmitting={updateAgreement.isPending}
        initialData={form.getValues()}
        onAfterSave={handleAfterSave} 
      />
    </div>
  );
};

export default EditAgreement;
