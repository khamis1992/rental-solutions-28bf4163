
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
import { logOperation } from '@/utils/monitoring-utils';

const EditAgreement = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAgreement, updateAgreement } = useAgreements();
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
      
      logOperation('agreement.fetch', 'success', { id }, 'Fetching agreement with ID');
      setIsLoading(true);
      try {
        const data = await getAgreement(id);
        logOperation('agreement.fetch', 'success', 
          { id, hasData: !!data }, 
          'Fetched agreement data');
        if (data) {
          const fullAgreement = adaptSimpleToFullAgreement(data);
          logOperation('agreement.fetch', 'success', 
            { id, hasAgreement: !!fullAgreement }, 
            'Converted to full agreement');
          setAgreement(fullAgreement);
          
          if (data.vehicle_id && (!data.vehicles || !Object.keys(data.vehicles).length)) {
            fetchVehicleDetails(data.vehicle_id);
          } else if (data.vehicles) {
            logOperation('agreement.fetch', 'success', 
              { id, hasVehicleData: !!data.vehicles },
              'Vehicle data already included');
            setVehicleData(data.vehicles);
          }
        } else {
          toast.error("Agreement not found");
          navigate("/agreements");
        }
      } catch (error) {
        logOperation('agreement.fetch', 'error', 
          { id, error: error instanceof Error ? error.message : String(error) },
          'Error fetching agreement for edit');
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
      logOperation('vehicle.fetch', 'success', 
        { vehicleId }, 
        'Fetching vehicle details for ID');
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();
        
      if (error) {
        logOperation('vehicle.fetch', 'error', 
          { vehicleId, error: error.message }, 
          'Error fetching vehicle details');
        return;
      }
      
      if (data) {
        logOperation('vehicle.fetch', 'success', 
          { vehicleId, hasData: !!data }, 
          'Fetched vehicle data');
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
      logOperation('vehicle.fetch', 'error', 
        { vehicleId, error: error instanceof Error ? error.message : String(error) },
        'Error in fetchVehicleDetails');
    }
  };

  useEffect(() => {
    if (rentAmount && agreement && !agreement.rent_amount) {
      logOperation('agreement.rentAmount', 'success', 
        { id: id || '', rentAmount }, 
        'Setting rent amount from hook');
      setAgreement(prev => prev ? { ...prev, rent_amount: rentAmount } : null);
    }
  }, [rentAmount, agreement, id]);

  const handleSubmit = async (updatedAgreement: Agreement) => {
    if (!id) return;
    
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
              logOperation('agreement.update', 'error', 
                { id, error: error instanceof Error ? error.message : String(error) },
                'Error updating agreement');
              setUpdateProgress(null);
              toast.error(`Failed to update: ${error.message || "Unknown error"}`);
              setIsSubmitting(false);
            },
            statusUpdateCallback // Pass the callback to track status updates
          ),
          timeoutPromise
        ]);
      } catch (timeoutError) {
        logOperation('agreement.update', 'error', 
          { id, error: timeoutError instanceof Error ? timeoutError.message : String(timeoutError) },
          'Operation timed out');
        toast.error("Operation timed out. The system might still be processing your request.");
        setIsSubmitting(false);
        setUpdateProgress(null);
      }
    } catch (error) {
      logOperation('agreement.update', 'error', 
        { id, error: error instanceof Error ? error.message : String(error) },
        'Error in handleSubmit');
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
