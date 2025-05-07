
import { useState, useEffect } from 'react';
import { Agreement } from '@/types/agreement';
import { supabase } from '@/integrations/supabase/client';
import { adaptSimpleToFullAgreement } from '@/utils/agreement-utils';
import { toast } from 'sonner';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { useNavigate } from 'react-router-dom';
import { useAgreements } from '@/hooks/use-agreements';

export function useEditAgreement(id: string | undefined) {
  const navigate = useNavigate();
  const { agreements, updateAgreement } = useAgreements();
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
        // Find agreement in the existing list
        const foundAgreement = agreements.find(a => a.id === id);
        
        if (foundAgreement) {
          console.log("Found agreement in list:", foundAgreement);
          const fullAgreement = adaptSimpleToFullAgreement(foundAgreement);
          setAgreement(fullAgreement);
          
          if (foundAgreement.vehicle_id && (!foundAgreement.vehicles || !Object.keys(foundAgreement.vehicles).length)) {
            fetchVehicleDetails(foundAgreement.vehicle_id);
          } else if (foundAgreement.vehicles) {
            console.log("Vehicle data already included:", foundAgreement.vehicles);
            setVehicleData(foundAgreement.vehicles);
          }
        } else {
          // Fetch directly if not found in the list
          const { data: fetchedData, error } = await supabase
            .from('leases')
            .select('*, vehicles(*), profiles:customer_id(*)')
            .eq('id', id)
            .single();
            
          if (error) {
            throw error;
          }
          
          if (fetchedData) {
            console.log("Fetched agreement data:", fetchedData);
            const fullAgreement = adaptSimpleToFullAgreement(fetchedData);
            setAgreement(fullAgreement);
            
            if (fetchedData.vehicle_id && (!fetchedData.vehicles || !Object.keys(fetchedData.vehicles || {}).length)) {
              fetchVehicleDetails(fetchedData.vehicle_id);
            } else if (fetchedData.vehicles) {
              console.log("Vehicle data already included:", fetchedData.vehicles);
              setVehicleData(fetchedData.vehicles);
            }
          } else {
            toast.error("Agreement not found");
            navigate("/agreements");
          }
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
  }, [id, navigate, hasAttemptedFetch, agreements]);

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
        
        // Type-safe way to update the agreement
        setAgreement(prev => {
          if (!prev) return null;
          
          // Create a new agreement object with updated vehicle information
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
