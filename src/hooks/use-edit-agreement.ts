
import { useState, useEffect } from 'react';
import { Agreement } from '@/types/agreement';
import { toast } from 'sonner';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { useNavigate } from 'react-router-dom';
import { useAgreements } from '@/hooks/use-agreements';
import { CustomerInfo } from '@/types/customer';
import { useAgreementDataFetching } from './agreement/use-agreement-data-fetching';
import { processAgreementData, processCustomerData } from '@/utils/agreement-data-processors';
import { ensureValidationLeaseStatus } from '@/utils/database-type-helpers';

/**
 * Hook for editing an existing agreement
 */
export function useEditAgreement(id: string | undefined) {
  const navigate = useNavigate();
  const { agreements } = useAgreements();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  
  // Get data fetching utilities
  const {
    vehicleData,
    setVehicleData,
    customerData,
    setCustomerData,
    fetchVehicleDetails,
    fetchCustomerDetails,
    updateAgreementWithData,
    fetchAgreementById
  } = useAgreementDataFetching();
  
  // Get rent amount calculation
  const { rentAmount } = useRentAmount(agreement, id);

  // Effect to fetch agreement data
  useEffect(() => {
    if (hasAttemptedFetch || !id) return;
    
    const fetchAgreement = async () => {
      if (!id) {
        toast.error("Agreement ID is required");
        navigate("/agreements");
        return;
      }
      
      console.log("Fetching agreement with ID:", id);
      setIsLoading(true);
      
      try {
        // First try to find agreement in the existing list for better performance
        const foundAgreement = agreements.find(a => a.id === id);
        
        if (foundAgreement) {
          console.log("Found agreement in list:", foundAgreement);
          
          // Process the found agreement data
          const processedAgreement = processAgreementData(foundAgreement);
          
          if (processedAgreement) {
            // Ensure the status is compatible with ValidationLeaseStatus
            const safeAgreement = {
              ...processedAgreement,
              status: ensureValidationLeaseStatus(processedAgreement.status)
            };
            setAgreement(safeAgreement);
            
            // Process and set customer data if available
            if (foundAgreement.customers || foundAgreement.profiles) {
              const customer = processCustomerData(foundAgreement.customers || foundAgreement.profiles);
              if (customer) {
                console.log("Customer data processed:", customer);
                setCustomerData(customer);
              }
            } else if (foundAgreement.customer_id) {
              await fetchCustomerDetails(foundAgreement.customer_id);
            }
            
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
          // If not found in the list, fetch directly from database
          const fetchedAgreement = await fetchAgreementById(id);
          
          if (fetchedAgreement) {
            // Ensure the status is compatible with ValidationLeaseStatus
            const safeAgreement = {
              ...fetchedAgreement,
              status: ensureValidationLeaseStatus(fetchedAgreement.status)
            };
            setAgreement(safeAgreement);
            
            // Handle vehicle data
            const vehicleId = fetchedAgreement.vehicle_id;
            if (vehicleId && !fetchedAgreement.vehicles) {
              await fetchVehicleDetails(vehicleId);
            } else if (fetchedAgreement.vehicles) {
              setVehicleData(fetchedAgreement.vehicles);
            }
            
            // Handle customer data
            if (fetchedAgreement.customer_id && !fetchedAgreement.customers) {
              await fetchCustomerDetails(fetchedAgreement.customer_id);
            } else if (fetchedAgreement.customers) {
              const customerInfo = processCustomerData(fetchedAgreement.customers);
              if (customerInfo) setCustomerData(customerInfo);
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
  }, [id, navigate, hasAttemptedFetch, agreements, fetchAgreementById, fetchCustomerDetails, fetchVehicleDetails]);

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
    customerData,
    setVehicleData 
  };
}
