
import { supabase } from '@/lib/supabase';
import { Agreement } from '@/types/agreement';
import { CustomerInfo } from '@/types/customer';
import { processAgreementData, processCustomerData } from '@/utils/agreement-data-processors';
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Hook for fetching vehicle and customer details for agreements
 */
export function useAgreementDataFetching() {
  const [vehicleData, setVehicleData] = useState<any>(null);
  const [customerData, setCustomerData] = useState<CustomerInfo | null>(null);
  
  /**
   * Fetch vehicle details by ID
   */
  const fetchVehicleDetails = async (vehicleId: string) => {
    try {
      console.log("Fetching vehicle details for ID:", vehicleId);
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId);
        
      if (error) {
        console.error("Error fetching vehicle details:", error);
        return null;
      }
      
      if (data && data.length > 0) {
        const vehicleDetails = data[0];
        console.log("Fetched vehicle data:", vehicleDetails);
        setVehicleData(vehicleDetails);
        return vehicleDetails;
      }
      return null;
    } catch (error) {
      console.error("Error in fetchVehicleDetails:", error);
      return null;
    }
  };
  
  /**
   * Fetch customer details by ID
   */
  const fetchCustomerDetails = async (customerId: string) => {
    try {
      console.log("Fetching customer details for ID:", customerId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', customerId)
        .single();
        
      if (error) {
        console.error("Error fetching customer details:", error);
        return null;
      }
      
      if (data) {
        console.log("Fetched customer data:", data);
        
        // Process customer data
        const customer = processCustomerData(data);
        if (customer) {
          setCustomerData(customer);
          return customer;
        }
      }
      return null;
    } catch (error) {
      console.error("Error in fetchCustomerDetails:", error);
      return null;
    }
  };
  
  /**
   * Update agreement with fetched data
   */
  const updateAgreementWithData = (
    agreement: Agreement | null, 
    fetchedVehicleData: any, 
    fetchedCustomerData: CustomerInfo | null
  ): Agreement | null => {
    if (!agreement) return null;
    
    let updatedAgreement = { ...agreement };
    
    if (fetchedVehicleData) {
      updatedAgreement = {
        ...updatedAgreement,
        vehicles: fetchedVehicleData || {},
        vehicle_make: fetchedVehicleData?.make,
        vehicle_model: fetchedVehicleData?.model,
        license_plate: fetchedVehicleData?.license_plate
      };
    }
    
    if (fetchedCustomerData) {
      updatedAgreement = {
        ...updatedAgreement,
        customers: fetchedCustomerData || {}
      };
    }
    
    return updatedAgreement;
  };
  
  /**
   * Find agreement by ID directly from Supabase
   */
  const fetchAgreementById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('leases')
        .select('*, vehicles(*), profiles:customer_id(*)')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error("Error in Supabase query:", error);
        toast.error("Failed to load agreement details");
        return null;
      }
      
      if (data) {
        console.log("Fetched agreement data:", data);
        return processAgreementData(data);
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching agreement by ID:", error);
      return null;
    }
  };
  
  return {
    vehicleData,
    setVehicleData,
    customerData,
    setCustomerData,
    fetchVehicleDetails,
    fetchCustomerDetails,
    updateAgreementWithData,
    fetchAgreementById,
  };
}
