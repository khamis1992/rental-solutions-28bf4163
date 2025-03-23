import { useState, useEffect } from 'react';
import { useApiMutation, useApiQuery } from './use-api';
import { supabase } from '@/lib/supabase';
import { Agreement, AgreementFilters, doesLicensePlateMatchNumeric } from '@/lib/validation-schemas/agreement';
import { toast } from 'sonner';

export const useAgreements = (initialFilters: AgreementFilters = {
  query: '',
  status: 'all',
}) => {
  const [searchParams, setSearchParams] = useState<AgreementFilters>(initialFilters);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    setError(null);
  }, [searchParams]);

  const { data: agreements, isLoading, refetch } = useApiQuery(
    ['agreements', JSON.stringify(searchParams)],
    async () => {
      try {
        console.log('Fetching agreements with params:', searchParams);
        
        const searchTerm = searchParams.query?.trim() || '';
        const isNumericSearch = /^\d+$/.test(searchTerm);
        
        if (isNumericSearch && searchTerm.length >= 2) {
          console.log(`Detected numeric search with ${searchTerm}. Performing optimized vehicle search first.`);
          
          const vehicleMatches = await performOptimizedVehicleSearch(searchTerm);
          
          if (vehicleMatches && vehicleMatches.length > 0) {
            console.log(`Found ${vehicleMatches.length} vehicle matches for numeric search "${searchTerm}":`, vehicleMatches.map(v => v.license_plate));
            
            const { data: vehicleAgreements, error: vehicleAgreementsError } = await supabase
              .from('leases')
              .select(`
                *
              `)
              .in('vehicle_id', vehicleMatches.map(v => v.id));
              
            if (vehicleAgreementsError) {
              console.error("Error fetching vehicle agreements:", vehicleAgreementsError);
              setError(`Failed to load agreements: ${vehicleAgreementsError.message}`);
              toast.error(`Failed to load agreements: ${vehicleAgreementsError.message}`);
              return [];
            } else if (vehicleAgreements && vehicleAgreements.length > 0) {
              console.log(`Found ${vehicleAgreements.length} agreements for matched vehicles`);
              
              const vehicleData = vehicleMatches.reduce((acc, vehicle) => {
                acc[vehicle.id] = vehicle;
                return acc;
              }, {});
              
              const customerIds = vehicleAgreements.map(a => a.customer_id).filter(Boolean);
              const customerData = await fetchCustomerData(customerIds);
              
              return transformLeaseData(vehicleAgreements, customerData, vehicleData);
            }
          }
          
          console.log(`No direct vehicle matches for "${searchTerm}", falling back to standard search`);
        }
        
        let query = supabase.from('leases').select(`
          *
        `);
        
        if (searchParams.status && searchParams.status !== 'all') {
          query = query.eq('status', searchParams.status);
        }
        
        if (searchParams.customer_id) {
          query = query.eq('customer_id', searchParams.customer_id);
        }
        
        if (searchParams.vehicle_id) {
          query = query.eq('vehicle_id', searchParams.vehicle_id);
        }
        
        const { data: allLeases, error: allLeasesError } = await query
          .order('created_at', { ascending: false })
          .limit(200);
            
        if (allLeasesError) {
          console.error("Error fetching agreements:", allLeasesError);
          setError(`Failed to load agreements: ${allLeasesError.message}`);
          toast.error(`Failed to load agreements: ${allLeasesError.message}`);
          return [];
        }
        
        if (!allLeases || allLeases.length === 0) {
          console.log("No agreements found in base database query");
          
          if (isNumericSearch) {
            console.log(`Attempting last-resort search for numeric pattern: ${searchTerm}`);
            return await performLastResortSearch(searchTerm);
          }
          
          return [];
        }
        
        console.log(`Retrieved ${allLeases.length} agreements for filtering`);
        
        const vehicleIds = allLeases.map(lease => lease.vehicle_id).filter(Boolean);
        const customerIds = allLeases.map(lease => lease.customer_id).filter(Boolean);
        
        const [customerData, vehicleData] = await Promise.all([
          fetchCustomerData(customerIds),
          fetchVehicleData(vehicleIds)
        ]);
        
        const transformedLeases = transformLeaseData(allLeases, customerData, vehicleData);
        
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
  
  const performLastResortSearch = async (numericSearch: string) => {
    try {
      console.log(`Performing last resort search for: ${numericSearch}`);
      
      const { data: allVehicles } = await supabase
        .from('vehicles')
        .select('id, make, model, license_plate, image_url, year, color, vin')
        .limit(200);
        
      if (!allVehicles || allVehicles.length === 0) {
        console.log("No vehicles found for last resort search");
        return [];
      }
      
      const matchingVehicles = allVehicles.filter(vehicle => 
        doesLicensePlateMatchNumeric(vehicle.license_plate, numericSearch)
      );
      
      console.log(`Found ${matchingVehicles.length} matching vehicles in last resort search:`, 
        matchingVehicles.map(v => v.license_plate));
      
      if (matchingVehicles.length === 0) {
        return [];
      }
      
      const { data: vehicleAgreements } = await supabase
        .from('leases')
        .select('*')
        .in('vehicle_id', matchingVehicles.map(v => v.id));
        
      if (!vehicleAgreements || vehicleAgreements.length === 0) {
        console.log("No agreements found for matching vehicles");
        return [];
      }
      
      console.log(`Found ${vehicleAgreements.length} agreements in last resort search`);
      
      const vehicleData = matchingVehicles.reduce((acc, vehicle) => {
        acc[vehicle.id] = vehicle;
        return acc;
      }, {});
      
      const customerIds = vehicleAgreements.map(a => a.customer_id).filter(Boolean);
      const customerData = await fetchCustomerData(customerIds);
      
      return transformLeaseData(vehicleAgreements, customerData, vehicleData);
    } catch (error) {
      console.error("Error in last resort search:", error);
      return [];
    }
  };
  
  const performOptimizedVehicleSearch = async (numericSearch: string) => {
    try {
      console.log(`Performing optimized vehicle search for numeric pattern: "${numericSearch}"`);
      
      const numericResults = { data: null };
      
      const [directResults, customResults] = await Promise.all([
        supabase
          .from('vehicles')
          .select('id, make, model, license_plate, image_url, year, color, vin')
          .ilike('license_plate', `%${numericSearch}%`)
          .limit(50),
          
        supabase
          .from('vehicles')
          .select('id, make, model, license_plate, image_url, year, color, vin')
          .ilike('vin', `%${numericSearch}%`)
          .limit(50)
      ]);
      
      try {
        const rpcResult = await supabase.rpc('search_numeric_plates', { 
          search_pattern: numericSearch 
        }).limit(50);
        
        if (rpcResult.data) {
          numericResults.data = rpcResult.data;
        }
      } catch (rpcError) {
        console.log('RPC method not available, skipping numeric search:', rpcError);
      }
      
      const allResults = [
        ...(directResults.data || []),
        ...(numericResults.data || []),
        ...(customResults.data || [])
      ];
      
      const uniqueVehicles = [];
      const seenIds = new Set();
      
      for (const vehicle of allResults) {
        if (!seenIds.has(vehicle.id)) {
          seenIds.add(vehicle.id);
          uniqueVehicles.push(vehicle);
        }
      }
      
      console.log(`Found ${uniqueVehicles.length} unique vehicles matching "${numericSearch}":`, 
        uniqueVehicles.map(v => v.license_plate));
      
      return uniqueVehicles;
    } catch (error) {
      console.error("Error in optimized vehicle search:", error);
      return [];
    }
  };
  
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
  
  const filterLeases = (leases, searchTerm) => {
    if (!searchTerm) return leases;
    
    const searchTermLower = searchTerm.toLowerCase();
    const isNumericSearch = /^\d+$/.test(searchTerm);
    
    console.log(`Filtering with search term: "${searchTermLower}" (isNumeric: ${isNumericSearch})`);
    
    const results = leases.filter(agreement => {
      if (agreement.agreement_number?.toLowerCase().includes(searchTermLower)) {
        console.log(`Match found in agreement number: ${agreement.agreement_number}`);
        return true;
      }
      
      if (agreement.vehicles?.license_plate) {
        const plate = agreement.vehicles.license_plate;
        
        if (isNumericSearch && doesLicensePlateMatchNumeric(plate, searchTerm)) {
          console.log(`Match found in license plate (advanced): ${plate}`);
          return true;
        }
        
        if (!isNumericSearch && plate.toLowerCase().includes(searchTermLower)) {
          console.log(`Match found in license plate (standard): ${plate}`);
          return true;
        }
      }
      
      if (agreement.vehicles?.vin?.toLowerCase().includes(searchTermLower)) {
        console.log(`Match found in VIN: ${agreement.vehicles.vin}`);
        return true;
      }
      
      if (agreement.customers?.full_name?.toLowerCase().includes(searchTermLower)) {
        console.log(`Match found in customer name: ${agreement.customers.full_name}`);
        return true;
      }
      
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
      
      if (agreement.notes?.toLowerCase().includes(searchTermLower)) {
        console.log(`Match found in notes: ${agreement.notes}`);
        return true;
      }
      
      return false;
    });
    
    console.log(`Filter results: ${results.length} matches out of ${leases.length} total`);
    return results;
  };
  
  const createAgreement = useApiMutation(
    async (formData: Omit<Agreement, 'id'>) => {
      const { customers, vehicles, ...agreementData } = formData;
      
      console.log('Creating agreement with data:', agreementData);
      
      const { data, error } = await supabase
        .from('leases')
        .insert([agreementData])
        .select('id')
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
      
      if (data) {
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
