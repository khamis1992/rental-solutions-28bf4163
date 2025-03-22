
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
        
        // Basic text search for agreement number and notes only
        if (searchParams.query && searchParams.query.trim() !== '') {
          const searchTerm = searchParams.query.trim().toLowerCase();
          
          query = query.or(
            `agreement_number.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`
          );
        }
        
        // Limit results and add pagination for better performance
        query = query.order('created_at', { ascending: false }).limit(100);
        
        // Execute the query
        const { data: leaseData, error: leaseError } = await query;
        
        if (leaseError) {
          console.error("Error fetching agreements:", leaseError);
          setError(`Failed to load agreements: ${leaseError.message}`);
          toast.error(`Failed to load agreements: ${leaseError.message}`);
          return [];
        }
        
        // Use a new variable instead of trying to reassign the constant
        let dataToProcess = leaseData;
        
        if (!dataToProcess || dataToProcess.length === 0) {
          console.log('No agreements found in base database query');
          
          // If we're searching and found nothing with the basic search, we need to 
          // fetch all agreements and filter by vehicle/customer details
          if (searchParams.query && searchParams.query.trim() !== '') {
            // Get all agreements (limited to reasonable number) to search through
            const { data: allLeases, error: allLeasesError } = await supabase
              .from('leases')
              .select(`
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
              `)
              .order('created_at', { ascending: false })
              .limit(100);
              
            if (allLeasesError) {
              console.error("Error fetching all agreements:", allLeasesError);
              return [];
            }
            
            if (!allLeases || allLeases.length === 0) {
              console.log('No agreements found at all');
              return [];
            }
            
            // Use this data instead
            console.log('Using all leases for advanced search');
            dataToProcess = allLeases;
          } else {
            return [];
          }
        }
        
        // Fetch related customer data in a separate, optimized query
        const customerIds = dataToProcess.map(lease => lease.customer_id).filter(Boolean);
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
        
        // Fetch related vehicle data in a separate, optimized query
        const vehicleIds = dataToProcess.map(lease => lease.vehicle_id).filter(Boolean);
        let vehicleData = {};
        
        if (vehicleIds.length > 0) {
          const { data: vehicles, error: vehiclesError } = await supabase
            .from('vehicles')
            .select('id, make, model, license_plate, image_url, year, color, vin, registration_number')
            .in('id', vehicleIds);
            
          if (vehiclesError) {
            console.error("Error fetching vehicles:", vehiclesError);
          } else if (vehicles) {
            vehicleData = vehicles.reduce((acc, vehicle) => {
              acc[vehicle.id] = vehicle;
              return acc;
            }, {});
          }
        }
        
        // Transform the data first
        let transformedData = dataToProcess.map((lease: any): Agreement => ({
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
        
        // If there's a search term, filter the results to include vehicle and customer searches
        if (searchParams.query && searchParams.query.trim() !== '') {
          const searchTerm = searchParams.query.trim().toLowerCase();
          
          console.log(`Filtering results for search term: "${searchTerm}"`);
          
          transformedData = transformedData.filter(agreement => {
            // Check agreement number
            if (agreement.agreement_number?.toLowerCase().includes(searchTerm)) {
              console.log(`Match found in agreement number: ${agreement.agreement_number}`);
              return true;
            }
            
            // Check customer name
            if (agreement.customers?.full_name?.toLowerCase().includes(searchTerm)) {
              console.log(`Match found in customer name: ${agreement.customers.full_name}`);
              return true;
            }
            
            // Check vehicle fields
            if (agreement.vehicles) {
              const vehicle = agreement.vehicles;
              
              // Check if the search term is a part of the license plate
              if (vehicle.license_plate?.toLowerCase().includes(searchTerm)) {
                console.log(`Match found in license plate: ${vehicle.license_plate}`);
                return true;
              }
              
              // Check registration number - for vehicle numbers like 7042
              if (vehicle.registration_number?.toLowerCase().includes(searchTerm)) {
                console.log(`Match found in registration number: ${vehicle.registration_number}`);
                return true;
              }
              
              // Check VIN number
              if (vehicle.vin?.toLowerCase().includes(searchTerm)) {
                console.log(`Match found in VIN number: ${vehicle.vin}`);
                return true;
              }
              
              // Check make
              if (vehicle.make?.toLowerCase().includes(searchTerm)) {
                console.log(`Match found in vehicle make: ${vehicle.make}`);
                return true;
              }
              
              // Check model
              if (vehicle.model?.toLowerCase().includes(searchTerm)) {
                console.log(`Match found in vehicle model: ${vehicle.model}`);
                return true;
              }
              
              // Check if the search term is a year that matches the vehicle year
              if (vehicle.year && searchTerm.match(/^\d+$/) && vehicle.year.toString().includes(searchTerm)) {
                console.log(`Match found in vehicle year: ${vehicle.year}`);
                return true;
              }
              
              // Check if the search term is a number that appears in any numeric field
              if (searchTerm.match(/^\d+$/)) {
                // Check if this number appears in any part of the license plate
                if (vehicle.license_plate && vehicle.license_plate.replace(/\D/g, '').includes(searchTerm)) {
                  console.log(`Match found in license plate numbers: ${vehicle.license_plate}`);
                  return true;
                }
                
                // Check if it appears in the registration number
                if (vehicle.registration_number && vehicle.registration_number.replace(/\D/g, '').includes(searchTerm)) {
                  console.log(`Match found in registration number digits: ${vehicle.registration_number}`);
                  return true;
                }
                
                // Check if it appears in the VIN
                if (vehicle.vin && vehicle.vin.replace(/\D/g, '').includes(searchTerm)) {
                  console.log(`Match found in VIN digits: ${vehicle.vin}`);
                  return true;
                }
              }
              
              // Also check the combined string just to be sure
              const vehicleText = `${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.license_plate || ''} ${vehicle.year || ''} ${vehicle.vin || ''} ${vehicle.registration_number || ''}`.toLowerCase();
              if (vehicleText.includes(searchTerm)) {
                console.log(`Match found in combined vehicle info: ${vehicleText}`);
                return true;
              }
            }
            
            // Check notes
            if (agreement.notes?.toLowerCase().includes(searchTerm)) {
              console.log(`Match found in notes: ${agreement.notes}`);
              return true;
            }
            
            return false;
          });
          
          console.log(`After filtering: ${transformedData.length} agreements match the search`);
        }
        
        return transformedData || [];
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
      retry: 1, // Limit retries to prevent excessive requests
    }
  );
  
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
        
        // Get vehicle data
        let vehicleData = null;
        if (data.vehicle_id) {
          const { data: vehicle, error: vehicleError } = await supabase
            .from('vehicles')
            .select('id, make, model, license_plate, image_url, year, color, vin, registration_number')
            .eq('id', data.vehicle_id)
            .single();
            
          if (vehicleError) {
            console.error("Error fetching vehicle:", vehicleError);
          } else {
            vehicleData = vehicle;
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
    updateAgreement,
    deleteAgreement,
    getAgreement,
    refetch
  };
};
