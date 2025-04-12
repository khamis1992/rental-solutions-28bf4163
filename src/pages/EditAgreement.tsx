import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AgreementForm from '@/components/agreements/AgreementForm';
import PageContainer from '@/components/layout/PageContainer';
import { useAgreements } from '@/hooks/use-agreements';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Agreement, AgreementStatus } from '@/lib/validation-schemas/agreement';
import { updateAgreementWithCheck } from '@/utils/agreement-utils';
import { adaptSimpleToFullAgreement } from '@/utils/agreement-utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRentAmount } from '@/hooks/use-rent-amount'; 
import { supabase } from '@/integrations/supabase/client';

const EditAgreement = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgreement, updateAgreement } = useAgreements();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { rentAmount } = useRentAmount(agreement, id);
  const [vehicleData, setVehicleData] = useState<any>(null);

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
          const fullAgreement = adaptSimpleToFullAgreement(data);
          console.log("Converted to full agreement:", fullAgreement);
          setAgreement(fullAgreement);
          
          if (data.vehicle_id && (!data.vehicles || !Object.keys(data.vehicles).length)) {
            fetchVehicleDetails(data.vehicle_id);
          } else if (data.vehicles) {
            console.log("Vehicle data already included:", data.vehicles);
            setVehicleData(data.vehicles);
          }
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

  const fetchVehicleDetails = async (vehicleId: string) => {
    try {
      console.log("Fetching vehicle details for ID:", vehicleId);
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();
        
      if (error) {
        console.error("Error fetching vehicle details:", error);
        return;
      }
      
      if (data) {
        console.log("Fetched vehicle data:", data);
        setVehicleData(data);
        
        setAgreement(prev => {
          if (!prev) return null;
          return {
            ...prev,
            vehicles: data,
            vehicle_make: data.make,
            vehicle_model: data.model,
            license_plate: data.license_plate
          };
        });
      }
    } catch (error) {
      console.error("Error in fetchVehicleDetails:", error);
    }
  };

  useEffect(() => {
    if (rentAmount && agreement && !agreement.rent_amount) {
      console.log("Setting rent amount from hook:", rentAmount);
      setAgreement(prev => prev ? { ...prev, rent_amount: rentAmount } : null);
    }
  }, [rentAmount, agreement]);

  const handleSubmit = async (updatedAgreement: Agreement) => {
    if (!id) return;
    
    try {
      setIsSubmitting(true);
      
      const isChangingToActive = updatedAgreement.status === 'active' && 
                              agreement?.status !== 'active';
      const isChangingToClosed = updatedAgreement.status === 'closed' && 
                              agreement?.status !== 'closed';
                              
      if (isChangingToActive) {
        console.log("Status is being changed to active, payment schedule will be generated");
      }

      if (isChangingToClosed) {
        console.log("Status is being changed to closed, agreement will be finalized");
        toast.info("Agreement is being finalized and closed");
      }
      
      const { terms_accepted, additional_drivers, ...agreementData } = updatedAgreement;
      
      const updateData = {
        ...agreementData,
        id: id
      };
      
      await updateAgreementWithCheck(
        { id, data: updateData },
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
          initialData={{
            ...agreement,
            vehicles: vehicleData || agreement.vehicles
          }} 
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
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
