
import { useState, useEffect } from 'react';
import { Agreement } from '@/types/agreement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { useNavigate } from 'react-router-dom';
import { useAgreements } from '@/hooks/use-agreements';

// Helper function to ensure dates are properly handled
const ensureDate = (dateValue: string | Date | undefined): Date | undefined => {
  if (!dateValue) return undefined;
  return dateValue instanceof Date ? dateValue : new Date(dateValue);
};

// Helper function to safely access object properties
const safeProp = <T, K extends string>(obj: T | null | undefined, key: K): any => {
  if (!obj || typeof obj !== 'object') return undefined;
  return (obj as any)[key];
};

// Type guard to check if an object is not an error
const isNotError = (obj: any): boolean => {
  return obj && typeof obj === 'object' && !('error' in obj);
};

export function useEditAgreement(id: string | undefined) {
  const navigate = useNavigate();
  const { agreements } = useAgreements();
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
          
          // Convert any string dates to Date objects before setting state
          const processedAgreement: Agreement = {
            ...foundAgreement,
            start_date: ensureDate(foundAgreement.start_date),
            end_date: ensureDate(foundAgreement.end_date),
            created_at: ensureDate(foundAgreement.created_at as string),
            updated_at: ensureDate(foundAgreement.updated_at as string),
            // Ensure other properties are correctly typed
            vehicles: foundAgreement.vehicles || {}
          };
          
          setAgreement(processedAgreement);
          
          // Check if we need to fetch vehicle details
          if (foundAgreement.vehicle_id) {
            if (foundAgreement.vehicles && typeof foundAgreement.vehicles === 'object') {
              console.log("Vehicle data already included:", foundAgreement.vehicles);
              setVehicleData(foundAgreement.vehicles);
            } else {
              await fetchVehicleDetails(foundAgreement.vehicle_id);
            }
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
          
          if (fetchedData && isNotError(fetchedData)) {
            console.log("Fetched agreement data:", fetchedData);
            
            // Process the data to ensure date fields are Date objects
            const processedAgreement: Agreement = {
              ...fetchedData,
              start_date: ensureDate(fetchedData.start_date),
              end_date: ensureDate(fetchedData.end_date),
              created_at: ensureDate(fetchedData.created_at),
              updated_at: ensureDate(fetchedData.updated_at),
              // Ensure vehicles is properly structured
              vehicles: fetchedData.vehicles || {}
            };
            
            setAgreement(processedAgreement);
            
            // Check if we need to fetch vehicle details
            if (fetchedData.vehicle_id) {
              if (fetchedData.vehicles && typeof fetchedData.vehicles === 'object') {
                console.log("Vehicle data already included:", fetchedData.vehicles);
                setVehicleData(fetchedData.vehicles);
              } else {
                await fetchVehicleDetails(fetchedData.vehicle_id);
              }
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
      
      if (data && isNotError(data)) {
        console.log("Fetched vehicle data:", data);
        setVehicleData(data);
        
        // Safe update of agreement with vehicle info
        setAgreement(prev => {
          if (!prev) return null;
          
          const updatedAgreement: Agreement = {
            ...prev,
            vehicles: data,
          };

          // Only add these properties if data contains them and prev exists
          if (data.make) {
            // Use type assertion to add non-standard properties
            (updatedAgreement as any).vehicle_make = data.make;
          }
          if (data.model) {
            (updatedAgreement as any).vehicle_model = data.model;
          }
          if (data.license_plate) {
            (updatedAgreement as any).license_plate = data.license_plate;
          }
          
          return updatedAgreement;
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
      setAgreement(prev => {
        if (!prev) return null;
        return { ...prev, rent_amount: rentAmount };
      });
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
