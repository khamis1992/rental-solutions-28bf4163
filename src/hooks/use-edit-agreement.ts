
import { useState, useEffect } from 'react';
import { Agreement } from '@/types/agreement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { useNavigate } from 'react-router-dom';
import { useAgreements } from '@/hooks/use-agreements';
import { asDbId } from '@/types/database-types';

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
          
          // Convert any string dates to Date objects before setting state
          const processedAgreement: Agreement = {
            ...foundAgreement,
            start_date: foundAgreement.start_date ? new Date(foundAgreement.start_date as string) : undefined,
            end_date: foundAgreement.end_date ? new Date(foundAgreement.end_date as string) : undefined,
            created_at: foundAgreement.created_at ? new Date(foundAgreement.created_at as string) : undefined,
            updated_at: foundAgreement.updated_at ? new Date(foundAgreement.updated_at as string) : undefined
          };
          
          setAgreement(processedAgreement);
          
          // Check if we need to fetch vehicle details
          if (foundAgreement.vehicle_id) {
            if (foundAgreement.vehicles && typeof foundAgreement.vehicles === 'object') {
              console.log("Vehicle data already included:", foundAgreement.vehicles);
              setVehicleData(foundAgreement.vehicles);
            } else {
              fetchVehicleDetails(foundAgreement.vehicle_id);
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
          
          if (fetchedData) {
            console.log("Fetched agreement data:", fetchedData);
            
            // Process the data to ensure date fields are Date objects
            const processedAgreement: Agreement = {
              ...fetchedData,
              start_date: fetchedData.start_date ? new Date(fetchedData.start_date) : undefined,
              end_date: fetchedData.end_date ? new Date(fetchedData.end_date) : undefined,
              created_at: fetchedData.created_at ? new Date(fetchedData.created_at) : undefined,
              updated_at: fetchedData.updated_at ? new Date(fetchedData.updated_at) : undefined
            };
            
            setAgreement(processedAgreement);
            
            // Check if we need to fetch vehicle details
            if (fetchedData.vehicle_id) {
              if (fetchedData.vehicles && typeof fetchedData.vehicles === 'object') {
                console.log("Vehicle data already included:", fetchedData.vehicles);
                setVehicleData(fetchedData.vehicles);
              } else {
                fetchVehicleDetails(fetchedData.vehicle_id);
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
      
      if (data) {
        console.log("Fetched vehicle data:", data);
        setVehicleData(data);
        
        // Safe update of agreement with vehicle info
        setAgreement(prev => {
          if (!prev) return null;
          
          const updatedAgreement: Agreement = {
            ...prev,
            vehicles: data,
          };

          // Only add these properties if data contains them
          if (data.make) updatedAgreement.vehicle_make = data.make;
          if (data.model) updatedAgreement.vehicle_model = data.model;
          if (data.license_plate) updatedAgreement.license_plate = data.license_plate;
          
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
