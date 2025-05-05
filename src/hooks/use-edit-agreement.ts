
import { useState, useEffect } from 'react';
import { Agreement } from '@/types/agreement';
import { useAgreements } from '@/hooks/use-agreements';
import { supabase } from '@/integrations/supabase/client';
import { adaptSimpleToFullAgreement } from '@/utils/agreement-utils';
import { toast } from 'sonner';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { useNavigate } from 'react-router-dom';

export function useEditAgreement(id: string | undefined) {
  const navigate = useNavigate();
  const { getAgreement } = useAgreements();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [vehicleData, setVehicleData] = useState<any>(null);
  const { rentAmount } = useRentAmount(agreement, id);

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

  // Effect to set rent amount when it's available
  useEffect(() => {
    if (rentAmount && agreement && !agreement.rent_amount) {
      console.log("Setting rent amount from hook:", rentAmount);
      setAgreement(prev => prev ? { ...prev, rent_amount: rentAmount } : null);
    }
  }, [rentAmount, agreement]);

  return { 
    agreement, 
    setAgreement, 
    isLoading, 
    vehicleData, 
    setVehicleData 
  };
}
