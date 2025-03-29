
import React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ContractAmendment {
  id: string;
  contract_id: string;
  amendment_type: string;
  previous_value: string;
  new_value: string;
  amendment_date: Date;
  reason: string;
}

export function SmartContractManager() {
  const { register, handleSubmit, reset } = useForm();

  const onAmendContract = async (data: any) => {
    try {
      const amendment = {
        contract_id: data.contractId,
        amendment_type: data.amendmentType,
        previous_value: data.previousValue,
        new_value: data.newValue,
        reason: data.reason,
        amendment_date: new Date()
      };

      // Use a more generic approach with type assertion since contract_amendments 
      // might not be in the type definitions
      const { error } = await supabase
        .from('contract_amendments' as any)
        .insert(amendment);

      if (error) {
        toast.error('Failed to amend contract: ' + error.message);
        throw error;
      }
      
      toast.success('Contract amendment recorded successfully');
      reset();
    } catch (error) {
      console.error('Error amending contract:', error);
    }
  };

  return (
    <Card>
      <CardHeader>Contract Amendment</CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onAmendContract)} className="space-y-4">
          <Input {...register('contractId')} placeholder="Contract ID" />
          <Input {...register('amendmentType')} placeholder="Amendment Type" />
          <Input {...register('previousValue')} placeholder="Previous Value" />
          <Input {...register('newValue')} placeholder="New Value" />
          <Input {...register('reason')} placeholder="Amendment Reason" />
          <Button type="submit">Record Amendment</Button>
        </form>
      </CardContent>
    </Card>
  );
}
