import { useState, useEffect } from 'react';
import { useApiMutation, useApiQuery } from './use-api';
import { supabase } from '@/lib/supabase';
import { Agreement, AgreementFilters } from '@/lib/validation-schemas/agreement';
import { toast } from 'sonner';

export const useAgreements = (initialFilters: AgreementFilters = {
  query: '',
  status: 'all',
}) => {
  const [searchParams, setSearchParams] = useState<AgreementFilters>(initialFilters);
  const [error, setError] = useState<string | null>(null);
  
  // Clear error when search params change
  useEffect(() => {
    setError(null);
  }, [searchParams]);

  // Optimized fetch agreements with better error handling
  const { data: agreements, isLoading, refetch } = useApiQuery(
    ['agreements', JSON.stringify(searchParams)],
    async () => {
      try {
        console.log('Fetching agreements with params:', searchParams);
        
        // First, let's get the basic lease data with optimized query
        let query = supabase.from('leases').select(`
          id, 
          customer_id, 
          vehicle_id, 
          start_date, 
          end_date, 
          status, 
          created_at, 
          updated_at, 
          total_amount, 
          down_payment, 
          agreement_number, 
          notes
        `);
        
        // Apply filters for status, customer_id, and vehicle_id first
        // as these are exact matches and can be done at DB level
        if (searchParams.status && searchParams.status !== 'all') {
          query = query.eq('status', searchParams.status);
        }
        
        if (searchParams.customer_id) {
          query = query.eq('customer_id', searchParams.customer_id);
        }
        
        if (searchParams.vehicle_id) {
          query = query.eq('vehicle_id', searchParams.vehicle_id);
        }
        
        const searchTerm = searchParams.query?.trim() || '';
        
        // Execute the query to get all agreements that we'll filter
        const { data: allLeases, error: allLeasesError } = await query
          .order('created_at', { ascending: false })
          .limit(200);  // Increased limit for more comprehensive search
            
        if (allLeasesError) {
          console.error("Error fetching agreements:", allLeasesError);
          setError(`Failed to load agreements: ${allLeasesError.message}`);
          toast.error(`Failed to load agreements: ${allLeasesError.message}`);
          return [];
        }
        
        if (!allLeases || allLeases.length === 0) {
          console.log("No agreements found in base database query");
          return [];
        }
        
        console.log(`Retrieved ${allLeases.length} agreements for filtering`);
        
        // If there's no search term, skip the additional vehicle data fetch
        if (!searchTerm) {
          return transformLeaseData(allLeases, {}, {});
        }
        
        // For more effective vehicle search, we should always fetch vehicle data when there's a search term
        const vehicleIds = allLeases.map(lease => lease.vehicle_id).filter(Boolean);
        const customerIds = allLeases.map(lease => lease.customer_id).filter(Boolean);
        
        // Fetch related data in parallel for better performance
        const [customerData, vehicleData] = await Promise.all([
          fetchCustomerData(customerIds),
          fetchVehicleData(vehicleIds)
        ]);
        
        // Transform raw lease data to Agreement objects
        const transformedLeases = transformLeaseData(allLeases, customerData, vehicleData);
        
        // Now perform filtering with the full dataset that includes vehicle info
        const filteredData = filterLeases(transformedLeases, searchTerm);
        
        console.log(`After filtering: ${filteredData.length} agreements match the search`);
        return filteredData;
      } catch (err) {
        console.error("Unexpected error in useAgreements:", err);
        setError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
        toast.error("An unexpected error occurred while loading agreements");
        return [];
      }
    },
    {
      staleTime: 60000,
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );
  
  // Fetch customer data for given IDs
  const fetchCustomerData = async (customerIds: string[]) => {
    let customerData = {};
    
    if (customerIds.length > 0) {
      const { data: customers, error: customersError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone_number')
        .in('id', customerIds);
        
      if (customersError) {
        console.error("Error fetching customers:", customersError);
      } else if (customers) {
        customerData = customers.reduce((acc, customer) => {
          acc[customer.id] = customer;
          return acc;
        }, {});
      }
    }
    
    return customerData;
  };
  
  // Fetch vehicle data for given IDs
  const fetchVehicleData = async (vehicleIds: string[]) => {
    let vehicleData = {};
    
    if (vehicleIds.length > 0) {
      try {
        const { data: vehicles, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, make, model, license_plate, image_url, year, color, vin')
          .in('id', vehicleIds);
          
        if (vehiclesError) {
          console.error("Error fetching vehicles:", vehiclesError);
        } else if (vehicles) {
          vehicleData = vehicles.reduce((acc, vehicle) => {
            acc[vehicle.id] = vehicle;
            return acc;
          }, {});
          console.log(`Fetched details for ${vehicles.length} vehicles`);
        }
      } catch (error) {
        console.error("Error processing vehicles:", error);
      }
    } else {
      console.log("No vehicle IDs to fetch");
    }
    
    return vehicleData;
  };
  
  // Transform lease data from Supabase to Agreement objects
  const transformLeaseData = (leases, customerData, vehicleData) => {
    return leases.map((lease: any): Agreement => ({
      id: lease.id,
      customer_id: lease.customer_id,
      vehicle_id: lease.vehicle_id,
      start_date: new Date(lease.start_date),
      end_date: new Date(lease.end_date),
      status: lease.status,
      created_at: lease.created_at ? new Date(lease.created_at) : undefined,
      updated_at: lease.updated_at ? new Date(lease.updated_at) : undefined,
      total_amount: lease.total_amount || 0,
      deposit_amount: lease.down_payment || 0,
      agreement_number: lease.agreement_number || '',
      notes: lease.notes || '',
      terms_accepted: true,
      additional_drivers: [],
      customers: customerData[lease.customer_id] || null,
      vehicles: vehicleData[lease.vehicle_id] || null
    }));
  };
  
  // Filter leases based on search term
  const filterLeases = (leases, searchTerm) => {
    if (!searchTerm) return leases;
    
    const searchTermLower = searchTerm.toLowerCase();
    const isNumericSearch = /^\d+$/.test(searchTerm);
    
    console.log(`Filtering with search term: "${searchTermLower}" (isNumeric: ${isNumericSearch})`);
    
    return leases.filter(agreement => {
      // Check agreement number
      if (agreement.agreement_number?.toLowerCase().includes(searchTermLower)) {
        console.log(`Match found in agreement number: ${agreement.agreement_number}`);
        return true;
      }
      
      // SIMPLIFIED VEHICLE NUMBER SEARCH - DIRECT APPROACH FOR ALL CASES
      if (agreement.vehicles?.license_plate) {
        // First, try simple direct match (case insensitive) like we do for agreement numbers
        const plate = agreement.vehicles.license_plate.toLowerCase();
        
        // Simple includes check - catches most casual searches
        if (plate.includes(searchTermLower)) {
          console.log(`Match found in license plate (direct): ${plate}`);
          return true;
        }
        
        // For numeric searches, also remove all non-digit characters and compare
        if (isNumericSearch) {
          // Extract only numbers from the plate
          const plateNumbers = plate.replace(/\D/g, '');
          
          // Direct match against extracted numbers
          if (plateNumbers === searchTerm) {
            console.log(`Match found in license plate numbers: ${plate} → ${plateNumbers}`);
            return true;
          }
          
          // Substring match against extracted numbers
          if (plateNumbers.includes(searchTerm)) {
            console.log(`Match found in license plate numbers (substring): ${plate} → ${plateNumbers} contains ${searchTerm}`);
            return true;
          }
          
          // Match with trimmed leading zeros
          const trimmedPlateDigits = plateNumbers.replace(/^0+/, '');
          const trimmedSearchTerm = searchTerm.replace(/^0+/, '');
          
          if (trimmedPlateDigits === trimmedSearchTerm) {
            console.log(`Match found in license plate with trimmed zeros: ${plate} → ${trimmedPlateDigits} matches ${trimmedSearchTerm}`);
            return true;
          }
          
          // Last resort - is the search term exactly the vehicle_id?
          if (agreement.vehicle_id === searchTerm) {
            console.log(`Match found in vehicle ID: ${agreement.vehicle_id}`);
            return true;
          }
        }
      }
      
      // Also match VIN numbers for thoroughness
      if (agreement.vehicles?.vin?.toLowerCase().includes(searchTermLower)) {
        console.log(`Match found in VIN: ${agreement.vehicles.vin}`);
        return true;
      }
      
      // Check customer name
      if (agreement.customers?.full_name?.toLowerCase().includes(searchTermLower)) {
        console.log(`Match found in customer name: ${agreement.customers.full_name}`);
        return true;
      }
      
      // Check additional vehicle fields for good measure
      if (agreement.vehicles) {
        const vehicle = agreement.vehicles;
        if (
          vehicle.make?.toLowerCase().includes(searchTermLower) ||
          vehicle.model?.toLowerCase().includes(searchTermLower)
        ) {
          console.log(`Match found in vehicle make/model: ${vehicle.make} ${vehicle.model}`);
          return true;
        }
      }
      
      // Check notes
      if (agreement.notes?.toLowerCase().includes(searchTermLower)) {
        console.log(`Match found in notes: ${agreement.notes}`);
        return true;
      }
      
      return false;
    });
  };
  
  // Create agreement
  const createAgreement = useApiMutation(
    async (agreement: Omit<Agreement, 'id'>) => {
      const { data, error } = await supabase
        .from('leases')
        .insert(agreement)
        .select()
        .single();
        
      if (error) {
        console.error("Error creating agreement:", error);
        throw new Error(error.message);
      }
      
      return data;
    },
    {
      onSuccess: () => {
        toast.success("Agreement created successfully");
        refetch();
      }
    }
  );
  
  // Update agreement
  const updateAgreement = useApiMutation(
    async ({ id, data }: { id: string, data: Partial<Agreement> }) => {
      const { data: updatedData, error } = await supabase
        .from('leases')
        .update(data)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error("Error updating agreement:", error);
        throw new Error(error.message);
      }
      
      return updatedData;
    },
    {
      onSuccess: () => {
        toast.success("Agreement updated successfully");
        refetch();
      }
    }
  );
  
  // Delete agreement
  const deleteAgreement = useApiMutation(
    async (id: string) => {
      const { error } = await supabase
        .from('leases')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Error deleting agreement:", error);
        throw new Error(error.message);
      }
      
      return id;
    },
    {
      onSuccess: () => {
        toast.success("Agreement deleted successfully");
        refetch();
      }
    }
  );
  
  // Get agreement by ID
  const getAgreement = async (id: string): Promise<Agreement | null> => {
    try {
      console.log(`Fetching agreement details for ID: ${id}`);
      const { data, error } = await supabase
        .from('leases')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error("Error fetching agreement:", error);
        toast.error(`Failed to load agreement details: ${error.message}`);
        return null;
      }
      
      // If we have the lease data, get the related customer and vehicle data
      if (data) {
        // Get customer data
        let customerData = null;
        if (data.customer_id) {
          const { data: customer, error: customerError } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone_number')
            .eq('id', data.customer_id)
            .single();
            
          if (customerError) {
            console.error("Error fetching customer:", customerError);
          } else {
            customerData = customer;
          }
        }
        
        // Get vehicle data - optimized with error handling
        let vehicleData = null;
        if (data.vehicle_id) {
          try {
            const { data: vehicle, error: vehicleError } = await supabase
              .from('vehicles')
              .select('id, make, model, license_plate, image_url, year, color, vin')
              .eq('id', data.vehicle_id)
              .single();
              
            if (vehicleError) {
              console.error("Error fetching vehicle:", vehicleError);
            } else {
              vehicleData = vehicle;
            }
          } catch (error) {
            console.error("Error processing vehicle data:", error);
          }
        }
        
        // Transform to Agreement type
        return {
          id: data.id,
          customer_id: data.customer_id,
          vehicle_id: data.vehicle_id,
          start_date: new Date(data.start_date),
          end_date: new Date(data.end_date),
          status: data.status,
          created_at: data.created_at ? new Date(data.created_at) : undefined,
          updated_at: data.updated_at ? new Date(data.updated_at) : undefined,
          total_amount: data.total_amount || 0,
          deposit_amount: data.down_payment || 0,
          agreement_number: data.agreement_number || '',
          notes: data.notes || '',
          terms_accepted: true,
          additional_drivers: [],
          customers: customerData,
          vehicles: vehicleData
        };
      }
      
      return null;
    } catch (err) {
      console.error("Unexpected error in getAgreement:", err);
      toast.error("An unexpected error occurred while loading agreement details");
      return null;
    }
  };
  
  return {
    agreements,
    isLoading,
    error,
    searchParams,
    setSearchParams,
    createAgreement,
    updateAgreement: useApiMutation(
      async ({ id, data }: { id: string, data: Partial<Agreement> }) => {
        const { data: updatedData, error } = await supabase
          .from('leases')
          .update(data)
          .eq('id', id)
          .select()
          .single();
          
        if (error) {
          console.error("Error updating agreement:", error);
          throw new Error(error.message);
        }
        
        return updatedData;
      },
      {
        onSuccess: () => {
          toast.success("Agreement updated successfully");
          refetch();
        }
      }
    ),
    deleteAgreement: useApiMutation(
      async (id: string) => {
        const { error } = await supabase
          .from('leases')
          .delete()
          .eq('id', id);
          
        if (error) {
          console.error("Error deleting agreement:", error);
          throw new Error(error.message);
        }
        
        return id;
      },
      {
        onSuccess: () => {
          toast.success("Agreement deleted successfully");
          refetch();
        }
      }
    ),
    getAgreement,
    refetch
  };
};
