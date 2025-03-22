
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
        
        // Check if search term is a potential vehicle number (numeric only)
        const searchTerm = searchParams.query?.trim() || '';
        const isNumericSearch = /^\d{3,6}$/.test(searchTerm);
        
        // For numeric searches, we'll retrieve all agreements and filter them 
        // client-side for better matching with various vehicle number formats
        if (isNumericSearch) {
          console.log(`Numeric search detected: ${searchTerm} - will search all agreements for vehicle matches`);
          
          // Fetch all agreements for client-side filtering
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
            return [];
          }
          
          // Fetch related customer data
          const customerIds = allLeases.map(lease => lease.customer_id).filter(Boolean);
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
          
          // Fetch related vehicle data with improved error handling
          const vehicleIds = allLeases.map(lease => lease.vehicle_id).filter(Boolean);
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
              }
            } catch (error) {
              console.error("Error processing vehicles:", error);
            }
          }
          
          // Transform the data
          let transformedData = allLeases.map((lease: any): Agreement => ({
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
          
          // Enhanced vehicle number searching with multiple approaches
          return transformedData.filter(agreement => {
            if (agreement.vehicles?.license_plate) {
              const plate = agreement.vehicles.license_plate;
              
              // Direct match in license plate
              if (plate.includes(searchTerm)) {
                console.log(`Match found in license plate: ${plate}`);
                return true;
              }
              
              // Extract digits from license plate
              const digitsOnly = plate.replace(/\D/g, '');
              
              // Match with just the digits
              if (digitsOnly === searchTerm) {
                console.log(`Match found in license plate digits (exact): ${plate} (digits: ${digitsOnly})`);
                return true;
              }
              
              // Match with digits contained in the license plate
              if (digitsOnly.includes(searchTerm)) {
                console.log(`Match found in license plate digits (contains): ${plate} (digits: ${digitsOnly})`);
                return true;
              }
              
              // Try with leading zeros (common format in some systems)
              let paddedSearch = searchTerm;
              while (paddedSearch.length < 6) {
                paddedSearch = '0' + paddedSearch;
                if (digitsOnly.includes(paddedSearch)) {
                  console.log(`Match found with padded format: ${plate}, search: ${paddedSearch}`);
                  return true;
                }
              }
              
              // Try without leading zeros
              const trimmedDigits = digitsOnly.replace(/^0+/, '');
              if (trimmedDigits === searchTerm || searchTerm === trimmedDigits) {
                console.log(`Match found with trimmed digits: ${plate}, trimmed: ${trimmedDigits}`);
                return true;
              }
              
              // Check if search is subset of license plate digits or vice versa
              if (digitsOnly.includes(searchTerm) || searchTerm.includes(digitsOnly)) {
                console.log(`Partial match in digits: ${plate}, digits: ${digitsOnly}, search: ${searchTerm}`);
                return true;
              }
            }
            
            // Also check agreement number digits
            if (agreement.agreement_number) {
              const agreementDigits = agreement.agreement_number.replace(/\D/g, '');
              if (agreementDigits.includes(searchTerm)) {
                console.log(`Match found in agreement number digits: ${agreement.agreement_number} (digits: ${agreementDigits})`);
                return true;
              }
            }
            
            return false;
          });
        } 
        // For text searches or agreement number searches
        else if (searchTerm) {
          // For text/agreement number searches, use the database filtering
          query = query.or(`agreement_number.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`);
        }
        
        // Execute the query if we didn't already handle numeric search above
        if (!isNumericSearch) {
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
            if (searchTerm) {
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
          
          // Fetch related vehicle data in a separate, optimized query with improved error handling
          const vehicleIds = dataToProcess.map(lease => lease.vehicle_id).filter(Boolean);
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
              }
            } catch (error) {
              console.error("Error processing vehicles:", error);
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
          if (searchTerm) {
            const searchTermLower = searchTerm.toLowerCase();
            
            console.log(`Filtering results for search term: "${searchTermLower}"`);
            
            // Check if the search is for a specific agreement like MR202462
            const agreementNumberRegex = /^[a-z]{2,3}20\d{2}\d+$/i;
            const isMRNumberSearch = agreementNumberRegex.test(searchTermLower);
            
            transformedData = transformedData.filter(agreement => {
              // For MR format searches, prioritize exact matches
              if (isMRNumberSearch && agreement.agreement_number?.toLowerCase() === searchTermLower) {
                console.log(`Exact match found for agreement number: ${agreement.agreement_number}`);
                return true;
              }
              
              // Check agreement number (partial match)
              if (agreement.agreement_number?.toLowerCase().includes(searchTermLower)) {
                console.log(`Match found in agreement number: ${agreement.agreement_number}`);
                return true;
              }
              
              // Check customer name
              if (agreement.customers?.full_name?.toLowerCase().includes(searchTermLower)) {
                console.log(`Match found in customer name: ${agreement.customers.full_name}`);
                return true;
              }
              
              // Check vehicle fields
              if (agreement.vehicles) {
                const vehicle = agreement.vehicles;
                
                // Check if the search term is a part of the license plate
                if (vehicle.license_plate?.toLowerCase().includes(searchTermLower)) {
                  console.log(`Match found in license plate: ${vehicle.license_plate}`);
                  return true;
                }
                
                // Check VIN number
                if (vehicle.vin?.toLowerCase().includes(searchTermLower)) {
                  console.log(`Match found in VIN number: ${vehicle.vin}`);
                  return true;
                }
                
                // Check make
                if (vehicle.make?.toLowerCase().includes(searchTermLower)) {
                  console.log(`Match found in vehicle make: ${vehicle.make}`);
                  return true;
                }
                
                // Check model
                if (vehicle.model?.toLowerCase().includes(searchTermLower)) {
                  console.log(`Match found in vehicle model: ${vehicle.model}`);
                  return true;
                }
                
                // Also check the combined string just to be sure
                const vehicleText = `${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.license_plate || ''} ${vehicle.year || ''} ${vehicle.vin || ''}`.toLowerCase();
                if (vehicleText.includes(searchTermLower)) {
                  console.log(`Match found in combined vehicle info: ${vehicleText}`);
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
            
            console.log(`After filtering: ${transformedData.length} agreements match the search`);
          }
          
          return transformedData || [];
        }
        
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
    updateAgreement,
    deleteAgreement,
    getAgreement,
    refetch
  };
};
