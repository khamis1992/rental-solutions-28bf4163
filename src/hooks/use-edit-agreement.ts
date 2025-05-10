
import { useState, useEffect } from 'react';
import { Agreement } from '@/types/agreement';
import { LeaseStatus, toValidationLeaseStatus } from '@/types/lease-types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { useNavigate } from 'react-router-dom';
import { useAgreements } from '@/hooks/use-agreements';
import { hasData } from '@/utils/supabase-type-helpers';

// Helper function to ensure dates are properly handled
const ensureDate = (dateValue: string | Date | undefined): Date | undefined => {
  if (!dateValue) return undefined;
  return dateValue instanceof Date ? dateValue : new Date(dateValue);
};

// Helper to safely process fetched data
const processFetchedData = (data: any): Agreement | null => {
  if (!data) return null;
  
  try {
    // Check if we have the necessary data
    if (!data.id) return null;
    
    const processedAgreement: Agreement = {
      id: data.id,
      status: (data.status as LeaseStatus) || 'draft',
      customer_id: data.customer_id || '',
      vehicle_id: data.vehicle_id || '',
      start_date: ensureDate(data.start_date) || new Date(),
      end_date: ensureDate(data.end_date) || new Date(),
      total_amount: data.total_amount || 0,
      created_at: data.created_at ? ensureDate(data.created_at) : undefined,
      updated_at: data.updated_at ? ensureDate(data.updated_at) : undefined,
      customers: data.customers || data.profiles || {},
      vehicles: data.vehicles || {},
      rent_amount: data.rent_amount || 0,
      agreement_number: data.agreement_number,
      agreement_type: data.agreement_type,
      notes: data.notes,
      payment_frequency: data.payment_frequency,
      payment_day: data.payment_day,
      daily_late_fee: data.daily_late_fee,
      deposit_amount: data.deposit_amount,
      remaining_amount: data.remaining_amount,
      next_payment_date: data.next_payment_date,
      last_payment_date: data.last_payment_date,
      vehicle_make: data.vehicles?.make,
      vehicle_model: data.vehicles?.model,
      license_plate: data.vehicles?.license_plate,
    };
    
    return processedAgreement;
  } catch (error) {
    console.error("Error processing agreement data:", error);
    return null;
  }
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
          
          // Process the found agreement data
          const processedAgreement = processFetchedData(foundAgreement);
          
          if (processedAgreement) {
            setAgreement(processedAgreement);
            
            // Check if we need to fetch vehicle details
            if (foundAgreement.vehicle_id) {
              if (foundAgreement.vehicles) {
                console.log("Vehicle data already included:", foundAgreement.vehicles);
                setVehicleData(foundAgreement.vehicles);
              } else {
                await fetchVehicleDetails(foundAgreement.vehicle_id);
              }
            }
          } else {
            throw new Error("Failed to process agreement data");
          }
        } else {
          // Fetch directly if not found in the list
          try {
            const { data, error } = await supabase
              .from('leases')
              .select('*, vehicles(*), profiles:customer_id(*)')
              .eq('id', id);
              
            if (error) {
              throw error;
            }
            
            if (data && data.length > 0) {
              const leaseData = data[0];
              console.log("Fetched agreement data:", leaseData);
              
              // Process the fetched data
              const processedAgreement = processFetchedData(leaseData);
              
              if (processedAgreement) {
                setAgreement(processedAgreement);
                
                // Check if we need to fetch vehicle details
                const vehicleId = leaseData.vehicle_id as string;
                if (vehicleId) {
                  const vehicles = leaseData.vehicles;
                  if (vehicles) {
                    console.log("Vehicle data already included:", vehicles);
                    setVehicleData(vehicles);
                  } else {
                    await fetchVehicleDetails(vehicleId);
                  }
                }
              } else {
                throw new Error("Failed to process fetched agreement data");
              }
            } else {
              toast.error("Agreement not found");
              navigate("/agreements");
            }
          } catch (error) {
            console.error("Error in Supabase query:", error);
            throw error;
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
        .eq('id', vehicleId);
        
      if (error) {
        console.error("Error fetching vehicle details:", error);
        return;
      }
      
      if (data && data.length > 0) {
        const vehicleDetails = data[0];
        console.log("Fetched vehicle data:", vehicleDetails);
        setVehicleData(vehicleDetails);
        
        // Safe update of agreement with vehicle info
        setAgreement((prev) => {
          if (!prev) return null;
          
          return {
            ...prev,
            vehicles: vehicleDetails || {},
            vehicle_make: vehicleDetails?.make,
            vehicle_model: vehicleDetails?.model,
            license_plate: vehicleDetails?.license_plate
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
