import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AgreementForm from '@/components/agreements/AgreementForm';
import PageContainer from '@/components/layout/PageContainer';
import { useAgreements } from '@/hooks/use-agreements';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { updateAgreementWithCheck, adaptSimpleToFullAgreement } from '@/utils/agreement'; // Updated import path
import { useAuth } from '@/contexts/AuthContext';
import { useRentAmount } from '@/hooks/use-rent-amount'; 
import { supabase } from '@/integrations/supabase/client';
import { withTimeoutAndRetry } from '@/utils/promise-utils';

const EditAgreement = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgreement } = useAgreements();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<string | null>(null);
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
      
      const result = await withTimeoutAndRetry(
        () => getAgreement(id),
        {
          operationName: "Agreement fetch",
          timeoutMs: 10000,
          retries: 1,
          onProgress: (message) => console.log(message)
        }
      );
      
      if (result.success && result.data) {
        console.log("Fetched agreement data:", result.data);
        const fullAgreement = adaptSimpleToFullAgreement(result.data);
        console.log("Converted to full agreement:", fullAgreement);
        setAgreement(fullAgreement);
        
        if (result.data.vehicle_id && (!result.data.vehicles || !Object.keys(result.data.vehicles).length)) {
          fetchVehicleDetails(result.data.vehicle_id);
        } else if (result.data.vehicles) {
          console.log("Vehicle data already included:", result.data.vehicles);
          setVehicleData(result.data.vehicles);
        }
      } else {
        console.error("Error fetching agreement:", result.error);
        toast.error("Agreement not found");
        navigate("/agreements");
      }
      
      setIsLoading(false);
      setHasAttemptedFetch(true);
    };

    fetchAgreement();
  }, [id, getAgreement, navigate, hasAttemptedFetch]);

  const fetchVehicleDetails = async (vehicleId: string) => {
    try {
      console.log("Fetching vehicle details for ID:", vehicleId);
      
      const result = await withTimeoutAndRetry(
        () => supabase.from('vehicles').select('*').eq('id', vehicleId).single(),
        {
          operationName: "Vehicle details fetch",
          timeoutMs: 5000
        }
      );
      
      if (!result.success || !result.data) {
        console.error("Error fetching vehicle details:", result.error);
        return;
      }
      
      console.log("Fetched vehicle data:", result.data);
      setVehicleData(result.data);
      
      setAgreement(prev => {
        if (!prev) return null;
        return {
          ...prev,
          vehicles: result.data,
          vehicle_make: result.data.make,
          vehicle_model: result.data.model,
          license_plate: result.data.license_plate
        };
      });
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
    
    setIsSubmitting(true);
    setUpdateProgress(null);
    
    // Check if the status is being changed to active or closed
    const isChangingToActive = updatedAgreement.status === 'active' && 
                            agreement?.status !== 'active';
    const isChangingToClosed = updatedAgreement.status === 'closed' && 
                            agreement?.status !== 'closed';
    
    // Set initial processing message
    if (isChangingToActive) {
      setUpdateProgress("Preparing to activate agreement...");
      toast.info("Activating agreement...");
    } else if (isChangingToClosed) {
      setUpdateProgress("Preparing to close agreement...");
      toast.info("Closing agreement...");
    } else {
      setUpdateProgress("Updating agreement...");
    }
    
    const { terms_accepted, additional_drivers, ...agreementData } = updatedAgreement;
    
    const updateData = {
      ...agreementData,
      id: id
    };
    
    // Use our improved timeout handling utility
    const result = await withTimeoutAndRetry(
      () => updateAgreementWithCheck(
        { id, data: updateData },
        user?.id
      ),
      {
        operationName: 'Agreement update',
        timeoutMs: 30000,
        retries: 1,
        onProgress: setUpdateProgress
      }
    );
    
    if (result.success) {
      setUpdateProgress("Agreement updated successfully!");
      toast.success("Agreement updated successfully");
      navigate(`/agreements/${id}`);
    } else {
      console.error("Error updating agreement:", result.error);
      setUpdateProgress(null);
      toast.error(`Failed to update: ${result.message || "Unknown error"}`);
    }
    
    setIsSubmitting(false);
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
        <>
          {updateProgress && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded mb-4">
              <p className="flex items-center">
                <span className="animate-pulse mr-2">⏳</span>
                <span>{updateProgress}</span>
              </p>
            </div>
          )}
          <AgreementForm 
            initialData={{
              ...agreement,
              vehicles: vehicleData || agreement.vehicles
            }} 
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </>
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
