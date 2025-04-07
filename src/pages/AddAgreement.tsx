
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AgreementFormWithVehicleCheck from '@/components/agreements/AgreementFormWithVehicleCheck';
import PageContainer from '@/components/layout/PageContainer';
import { useAgreements } from '@/hooks/use-agreements';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { checkVehicleAvailability, activateAgreement } from '@/utils/agreement-utils';

const AddAgreement = () => {
  const navigate = useNavigate();
  const { createAgreement } = useAgreements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [standardTemplateExists, setStandardTemplateExists] = useState(true);
  const [isCheckingTemplate, setIsCheckingTemplate] = useState(false);
  const { user } = useAuth();

  // Check if the standard template exists
  React.useEffect(() => {
    const checkTemplate = async () => {
      try {
        setIsCheckingTemplate(true);
        const { data, error } = await supabase
          .from('agreement_templates')
          .select('id')
          .eq('name', 'agreement temp')
          .single();
          
        if (error) {
          console.warn('Standard template not found:', error);
          setStandardTemplateExists(false);
        } else {
          setStandardTemplateExists(true);
        }
      } catch (err) {
        console.error('Error checking template existence:', err);
      } finally {
        setIsCheckingTemplate(false);
      }
    };
    
    checkTemplate();
  }, []);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      // Check if the vehicle is already assigned to another agreement
      const vehicleAvailabilityCheck = await checkVehicleAvailability(data.vehicle_id);
      
      if (!vehicleAvailabilityCheck.isAvailable) {
        const existingAgreementId = vehicleAvailabilityCheck.existingAgreement?.id;
        
        // Close the existing agreement
        if (existingAgreementId) {
          const { error: updateError } = await supabase
            .from('leases')
            .update({ 
              status: 'closed',
              updated_at: new Date().toISOString(),
              updated_by: user?.id || null,
              notes: `${data.notes ? data.notes + '\n' : ''}Closed automatically when vehicle was reassigned.`
            })
            .eq('id', existingAgreementId);
            
          if (updateError) {
            console.error('Error closing existing agreement:', updateError);
            toast.error('Failed to close existing agreement');
          } else {
            toast.info(`Automatically closed agreement #${vehicleAvailabilityCheck.existingAgreement.agreement_number || 'unknown'}`);
          }
        }
      }

      // Create the new agreement
      const result = await createAgreement.mutateAsync({
        agreement_number: data.agreement_number,
        customer_id: data.customer_id,
        vehicle_id: data.vehicle_id,
        status: data.status,
        start_date: data.start_date,
        end_date: data.end_date,
        rent_amount: data.rent_amount,
        total_amount: data.total_amount,
        notes: data.notes || '',
        rent_due_day: new Date(data.start_date).getDate(),
        daily_late_fee: data.daily_late_fee || 0,
        late_fee_grace_period: 3, // Default 3 days grace period
        security_deposit_amount: data.deposit_amount || 0,
        security_deposit_refunded: false,
        payment_schedule_type: 'monthly'
      });

      // Update vehicle status to rented
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({ status: 'rented' })
        .eq('id', data.vehicle_id);

      if (vehicleError) {
        console.error('Error updating vehicle status:', vehicleError);
        toast.error('Failed to update vehicle status');
      }

      // If agreement status is active, activate it right away
      if (data.status === 'active') {
        const createdAgreementResponse = await supabase
          .from('leases')
          .select('id')
          .eq('agreement_number', data.agreement_number)
          .single();
          
        if (createdAgreementResponse.error) {
          console.error('Error fetching created agreement:', createdAgreementResponse.error);
        } else if (createdAgreementResponse.data?.id) {
          await activateAgreement(createdAgreementResponse.data.id);
        }
      }
      
      toast.success('Agreement created successfully');
      navigate('/agreements');
    } catch (error) {
      console.error('Error creating agreement:', error);
      toast.error('Failed to create agreement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer 
      title="Create Agreement" 
      description="Set up a new rental agreement"
      backLink="/agreements"
    >
      <AgreementFormWithVehicleCheck 
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        standardTemplateExists={standardTemplateExists}
        isCheckingTemplate={isCheckingTemplate}
      />
    </PageContainer>
  );
};

export default AddAgreement;
