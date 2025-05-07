
import { useState, useEffect, useCallback } from 'react';
import { Agreement } from '@/types/agreement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { useNavigate } from 'react-router-dom';
import { useAgreements } from '@/hooks/use-agreements';
import { hasData, castDbId } from '@/utils/supabase-type-helpers';

// Helper function to ensure dates are properly handled
const ensureDate = (dateValue: string | Date | undefined): Date | undefined => {
  if (!dateValue) return undefined;
  return dateValue instanceof Date ? dateValue : new Date(dateValue);
};

// Type guard to check if an object is not an error
const isNotError = (obj: any): boolean => {
  return obj && typeof obj === 'object' && !('error' in obj) && obj !== null;
};

// Helper function to safely access object properties
const safeProp = <T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined => {
  if (!obj) return undefined;
  return obj[key];
};

// Type guard to check if object has expected properties
const hasExpectedProperties = (obj: any, properties: string[]): boolean => {
  if (!obj || typeof obj !== 'object') return false;
  return properties.every(prop => prop in obj);
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
            start_date: ensureDate(foundAgreement.start_date) || new Date(),
            end_date: ensureDate(foundAgreement.end_date) || new Date(),
            created_at: foundAgreement.created_at ? ensureDate(foundAgreement.created_at) : undefined,
            updated_at: foundAgreement.updated_at ? ensureDate(foundAgreement.updated_at) : undefined,
            // Ensure other properties are correctly typed
            vehicles: foundAgreement.vehicles || {}
          };
          
          setAgreement(processedAgreement);
          
          // Check if we need to fetch vehicle details
          if (foundAgreement.vehicle_id) {
            if (foundAgreement.vehicles && isNotError(foundAgreement.vehicles)) {
              console.log("Vehicle data already included:", foundAgreement.vehicles);
              setVehicleData(foundAgreement.vehicles);
            } else {
              await fetchVehicleDetails(foundAgreement.vehicle_id);
            }
          }
        } else {
          // Fetch directly if not found in the list
          const response = await supabase
            .from('leases')
            .select('*, vehicles(*), profiles:customer_id(*)')
            .eq('id', id)
            .single();
            
          if (response.error) {
            throw response.error;
          }
          
          const fetchedData = response.data;
          
          if (fetchedData && isNotError(fetchedData)) {
            console.log("Fetched agreement data:", fetchedData);
            
            // Type check for expected properties
            if (hasExpectedProperties(fetchedData, ['start_date', 'end_date'])) {
              // Process the data to ensure date fields are Date objects
              const processedAgreement: Agreement = {
                ...fetchedData as any, // Cast temporarily to bypass strictness
                start_date: fetchedData.start_date ? ensureDate(fetchedData.start_date as any) || new Date() : new Date(),
                end_date: fetchedData.end_date ? ensureDate(fetchedData.end_date as any) || new Date() : new Date(),
                created_at: fetchedData.created_at ? ensureDate(fetchedData.created_at as any) : undefined,
                updated_at: fetchedData.updated_at ? ensureDate(fetchedData.updated_at as any) : undefined,
                // Ensure vehicles is properly structured
                vehicles: fetchedData.vehicles || {}
              };
              
              setAgreement(processedAgreement);
              
              // Check if we need to fetch vehicle details
              if ('vehicle_id' in fetchedData && fetchedData.vehicle_id) {
                if ('vehicles' in fetchedData && fetchedData.vehicles && isNotError(fetchedData.vehicles)) {
                  console.log("Vehicle data already included:", fetchedData.vehicles);
                  setVehicleData(fetchedData.vehicles);
                } else {
                  await fetchVehicleDetails(fetchedData.vehicle_id as string);
                }
              }
            } else {
              throw new Error("Fetched data is missing required properties");
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
      const response = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();
        
      if (response.error) {
        console.error("Error fetching vehicle details:", response.error);
        return;
      }
      
      const data = response.data;
      
      if (data && isNotError(data)) {
        console.log("Fetched vehicle data:", data);
        setVehicleData(data);
        
        // Safe update of agreement with vehicle info
        setAgreement(prev => {
          if (!prev) return null;
          
          const updatedAgreement: Agreement = {
            ...prev,
            vehicles: data,
            vehicle_make: typeof data === 'object' && data && 'make' in data ? data.make as string : undefined,
            vehicle_model: typeof data === 'object' && data && 'model' in data ? data.model as string : undefined,
            license_plate: typeof data === 'object' && data && 'license_plate' in data ? data.license_plate as string : undefined
          };
          
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
