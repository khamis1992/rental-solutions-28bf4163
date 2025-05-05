
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
import { validateData } from '@/lib/validation-utils';
import { agreementSchema } from '@/lib/validation-schemas/agreement';

const EditAgreement = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgreement, updateAgreement } = useAgreements();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string> | null>(null);
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
    
    // Reset validation errors
    setValidationErrors(null);
    
    // Validate the data before submitting
    const validationResult = validateData(agreementSchema, updatedAgreement);
    if (!validationResult.success) {
      setValidationErrors(validationResult.errors);
      
      // Show the first error in a toast
      const firstError = Object.values(validationResult.errors)[0];
      toast.error(firstError || "Please check the form for errors");
      return;
    }
    
    try {
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
      
      // Use a timeout to handle potential hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Operation timed out")), 30000);
      });
      
      // Set up status update event handlers to track progress
      const statusUpdateCallback = (status: string) => {
        setUpdateProgress(status);
      };
      
      try {
        // Execute the operation with a timeout
        await Promise.race([
          updateAgreementWithCheck(
            { id, data: updateData },
            user?.id,
            () => {
              setUpdateProgress("Agreement updated successfully!");
              toast.success("Agreement updated successfully");
              navigate(`/agreements/${id}`);
            },
            (error: any) => {
              console.error("Error updating agreement:", error);
              setUpdateProgress(null);
              toast.error(`Failed to update: ${error.message || "Unknown error"}`);
              setIsSubmitting(false);
            },
            statusUpdateCallback // Pass the callback to track status updates
          ),
          timeoutPromise
        ]);
      } catch (timeoutError) {
        console.error("Operation timed out:", timeoutError);
        toast.error("Operation timed out. The system might still be processing your request.");
        setIsSubmitting(false);
        setUpdateProgress(null);
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error("Failed to update agreement");
      setIsSubmitting(false);
      setUpdateProgress(null);
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
        <>
          {updateProgress && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded mb-4">
              <p className="flex items-center">
                <span className="animate-pulse mr-2">⏳</span>
                <span>{updateProgress}</span>
              </p>
            </div>
          )}
          
          {validationErrors && Object.keys(validationErrors).length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
              <p className="font-medium">Please correct the following errors:</p>
              <ul className="list-disc pl-5 mt-2 text-sm">
                {Object.entries(validationErrors).map(([field, message]) => (
                  <li key={field}>{message}</li>
                ))}
              </ul>
            </div>
          )}
          
          <AgreementForm 
            initialData={{
              ...agreement,
              vehicles: vehicleData || agreement.vehicles
            }} 
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            validationErrors={validationErrors}
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
