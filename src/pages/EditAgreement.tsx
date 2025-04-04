import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AgreementForm from '@/components/agreements/AgreementForm';
import PageContainer from '@/components/layout/PageContainer';
import { useAgreements } from '@/hooks/use-agreements';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { updateAgreementWithCheck } from '@/utils/agreement-utils';
import { adaptSimpleToFullAgreement } from '@/utils/agreement-utils';
import { useAuth } from '@/contexts/AuthContext';

const EditAgreement = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgreement, updateAgreement } = useAgreements();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (hasAttemptedFetch) return;
    
    const fetchAgreement = async () => {
      if (!id) {
        toast.error("Agreement ID is required");
        navigate("/agreements");
        return;
      }
      
      console.log("Fetching agreement with ID:", id);
      setIsLoading(true);
      try {
        const data = await getAgreement(id);
        console.log("Fetched agreement data:", data);
        if (data) {
          setAgreement(adaptSimpleToFullAgreement(data));
        } else {
          toast.error("Agreement not found");
          navigate("/agreements");
        }
      } catch (error) {
        console.error("Error fetching agreement for edit:", error);
        toast.error("Failed to load agreement details");
        navigate("/agreements");
      } finally {
        setIsLoading(false);
        setHasAttemptedFetch(true);
      }
    };

    fetchAgreement();
  }, [id, getAgreement, navigate, hasAttemptedFetch]);

  const handleSubmit = async (updatedAgreement: Agreement) => {
    if (!id) return;
    
    try {
      setIsSubmitting(true);
      
      const isChangingToActive = updatedAgreement.status === 'active' && 
                              agreement?.status !== 'active';
                              
      if (isChangingToActive) {
        console.log("Status is being changed to active, payment schedule will be generated");
      }
      
      const agreementToUpdate = {
        ...updatedAgreement,
        customer_id: updatedAgreement.customer_id,
        vehicle_id: updatedAgreement.vehicle_id
      };
      
      if ('customer_data' in agreementToUpdate) delete agreementToUpdate.customer_data;
      if ('vehicle_data' in agreementToUpdate) delete agreementToUpdate.vehicle_data;
      if ('vehicles' in agreementToUpdate) delete agreementToUpdate.vehicles;
      if ('customers' in agreementToUpdate) delete agreementToUpdate.customers;
      if ('terms_accepted' in agreementToUpdate) delete agreementToUpdate.terms_accepted;
      if ('additional_drivers' in agreementToUpdate) delete agreementToUpdate.additional_drivers;
      
      await updateAgreementWithCheck(
        { id, data: agreementToUpdate },
        user?.id,
        () => navigate(`/agreements/${id}`),
        (error: any) => console.error("Error updating agreement:", error)
      );
    } catch (error) {
      console.error("Error updating agreement:", error);
      toast.error("Failed to update agreement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer
      title="Edit Agreement"
      description="Modify existing rental agreement details"
      backLink={`/agreements/${id}`}
    >
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : agreement ? (
        <AgreementForm 
          initialData={agreement} 
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          mode="edit"
        />
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Agreement not found</h3>
          <p className="text-muted-foreground">
            The agreement you're looking for doesn't exist or has been removed.
          </p>
        </div>
      )}
    </PageContainer>
  );
};

export default EditAgreement;
