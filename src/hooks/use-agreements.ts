
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { toast } from 'sonner';
import { FlattenType } from '@/utils/type-utils';

export interface SimpleAgreement {
  id: string;
  customer_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  total_amount: number;
  deposit_amount: number;
  agreement_number: string;
  notes: string;
  rent_amount?: number;
  daily_late_fee?: number;
  customer?: {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    phone_number?: string;
    address?: string;
    driver_license?: string;
  };
  vehicle?: {
    id: string;
    make?: string;
    model?: string;
    license_plate?: string;
    year?: number;
    color?: string;
    vin?: string;
  };
  payments?: Array<any>;
  customers?: {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    phone_number?: string;
    address?: string;
    driver_license?: string;
  };
  vehicles?: {
    id: string;
    make?: string;
    model?: string;
    license_plate?: string;
    year?: number;
    color?: string;
    vin?: string;
  };
  total_cost?: number;
}

interface SearchParams {
  query?: string;
  status?: string;
  customerId?: string;
  vehicleId?: string;
  startDate?: string;
  endDate?: string;
  customer_id?: string;
  vehicle_id?: string;
}

// Define valid status types to fix the type error
type ValidStatusType = 'active' | 'pending' | 'draft' | 'expired' | 'cancelled' | 'closed';

// Database status may have more specific values than what we expose in the UI
type DatabaseStatus = 'active' | 'pending_payment' | 'pending_deposit' | 'draft' | 'expired' | 'cancelled' | 'closed' | 'terminated';

const mapDatabaseStatus = (status: string): string => {
  const statusMap: Record<string, ValidStatusType> = {
    'active': 'active',
    'pending_payment': 'pending',
    'pending_deposit': 'pending',
    'draft': 'draft',
    'expired': 'expired',
    'cancelled': 'cancelled',
    'closed': 'closed',
    'terminated': 'cancelled'
  };
  
  // Convert status to lowercase and get mapped value, fallback to original
  const lowerStatus = status.toLowerCase();
  return statusMap[lowerStatus] || status;
};

// Default empty objects for customer and vehicle to prevent null errors
const DEFAULT_CUSTOMER = {
  id: "",
  full_name: "Unknown Customer",
  email: "",
  phone: "",
  phone_number: "",
  address: "",
  driver_license: ""
};

const DEFAULT_VEHICLE = {
  id: "",
  license_plate: "Unknown",
  make: "",
  model: "",
  year: 0,
  color: "",
  vin: ""
};

// Enhanced type guard to check if an object is a Supabase error
function isSupabaseError(obj: any): obj is { code: string; message: string } {
  return obj && 
         typeof obj === 'object' && 
         'code' in obj && 
         'message' in obj && 
         typeof obj.code === 'string' && 
         typeof obj.message === 'string';
}

export const useAgreements = (initialParams?: SearchParams) => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useState<SearchParams>(initialParams || {
    query: '',
    status: 'all'
  });

  const useAgreementsList = () => {
    return useQuery({
      queryKey: ['agreements', searchParams],
      queryFn: async () => {
        let query = supabase
          .from('leases')
          .select(`
            *,
            customer:customer_id(id, full_name, email, phone, phone_number, address, driver_license),
            vehicle:vehicle_id(*)
          `)
          .order('created_at', { ascending: false });

        if (searchParams.query && searchParams.query.trim() !== '') {
          query = query.or(`
            customer.full_name.ilike.%${searchParams.query}%,
            customer.phone.ilike.%${searchParams.query}%,
            vehicle.license_plate.ilike.%${searchParams.query}%,
            agreement_number.ilike.%${searchParams.query}%
          `);
        }

        if (searchParams.status && searchParams.status !== 'all') {
          // Need to cast as any here since we're dealing with potentially differing enum types
          query = query.eq('status', searchParams.status as any);
        }

        if (searchParams.customerId || searchParams.customer_id) {
          query = query.eq('customer_id', searchParams.customerId || searchParams.customer_id);
        }

        if (searchParams.vehicleId || searchParams.vehicle_id) {
          query = query.eq('vehicle_id', searchParams.vehicleId || searchParams.vehicle_id);
        }

        if (searchParams.startDate) {
          query = query.gte('start_date', searchParams.startDate);
        }

        if (searchParams.endDate) {
          query = query.lte('end_date', searchParams.endDate);
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(`Error fetching agreements: ${error.message}`);
        }

        return (data || []).map(item => {
          // Initialize with default values
          let safeCustomerData = {...DEFAULT_CUSTOMER};
          let safeVehicleData = {...DEFAULT_VEHICLE};
          
          // Process customer data if it exists and is not an error
          if (item.customer) {
            if (!isSupabaseError(item.customer)) {
              safeCustomerData = {
                id: item.customer.id || DEFAULT_CUSTOMER.id,
                full_name: item.customer.full_name || DEFAULT_CUSTOMER.full_name,
                email: item.customer.email || DEFAULT_CUSTOMER.email,
                phone: item.customer.phone || item.customer.phone_number || DEFAULT_CUSTOMER.phone,
                phone_number: item.customer.phone_number || item.customer.phone || DEFAULT_CUSTOMER.phone_number,
                address: item.customer.address || DEFAULT_CUSTOMER.address,
                driver_license: item.customer.driver_license || DEFAULT_CUSTOMER.driver_license
              };
            } else {
              console.warn("Customer data returned an error:", item.customer.message);
            }
          }
          
          // Process vehicle data if it exists and is not an error
          if (item.vehicle) {
            if (!isSupabaseError(item.vehicle)) {
              safeVehicleData = {
                id: item.vehicle.id || DEFAULT_VEHICLE.id,
                make: item.vehicle.make || DEFAULT_VEHICLE.make,
                model: item.vehicle.model || DEFAULT_VEHICLE.model,
                license_plate: item.vehicle.license_plate || DEFAULT_VEHICLE.license_plate,
                year: item.vehicle.year || DEFAULT_VEHICLE.year,
                color: item.vehicle.color || DEFAULT_VEHICLE.color,
                vin: item.vehicle.vin || DEFAULT_VEHICLE.vin
              };
            } else {
              console.warn("Vehicle data returned an error:", item.vehicle.message);
            }
          }

          const agreement: FlattenType<SimpleAgreement> = {
            ...item,
            status: mapDatabaseStatus(item.status || ''),
            total_amount: item.total_amount || 0,
            agreement_number: item.agreement_number || '',
            customer: safeCustomerData,
            vehicle: safeVehicleData,
            customers: safeCustomerData,
            vehicles: safeVehicleData,
            total_cost: item.total_amount || 0
          };
          return agreement;
        });
      }
    });
  };

  const agreementsQuery = useAgreementsList();

  const createAgreement = useMutation({
    mutationFn: async (agreementData: any) => {
      const { data, error } = await supabase
        .from('leases')
        .insert(agreementData)
        .select()
        .single();

      if (error) {
        throw new Error(`Error creating agreement: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement created successfully');
    }
  });

  const updateAgreement = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { data: updatedData, error } = await supabase
        .from('leases')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Error updating agreement: ${error.message}`);
      }

      return updatedData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      queryClient.invalidateQueries({ queryKey: ['agreement', variables.id] });
      toast.success('Agreement updated successfully');
    }
  });

  const deleteAgreement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leases')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Error deleting agreement: ${error.message}`);
      }

      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      queryClient.removeQueries({ queryKey: ['agreement', id] });
      toast.success('Agreement deleted successfully');
    }
  });

  const getAgreement = async (id: string) => {
    if (!id) return null;

    const { data, error } = await supabase
      .from('leases')
      .select(`
        *,
        customer:customer_id(id, full_name, email, phone, phone_number, address, driver_license),
        vehicle:vehicle_id(*),
        payments(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error fetching agreement: ${error.message}`);
    }

    // Initialize with default values
    let safeCustomerData = {...DEFAULT_CUSTOMER};
    let safeVehicleData = {...DEFAULT_VEHICLE};
    
    // Process customer data if it exists and is not an error
    if (data.customer) {
      if (!isSupabaseError(data.customer)) {
        safeCustomerData = {
          id: data.customer.id || DEFAULT_CUSTOMER.id,
          full_name: data.customer.full_name || DEFAULT_CUSTOMER.full_name,
          email: data.customer.email || DEFAULT_CUSTOMER.email,
          phone: data.customer.phone || data.customer.phone_number || DEFAULT_CUSTOMER.phone,
          phone_number: data.customer.phone_number || data.customer.phone || DEFAULT_CUSTOMER.phone_number,
          address: data.customer.address || DEFAULT_CUSTOMER.address,
          driver_license: data.customer.driver_license || DEFAULT_CUSTOMER.driver_license
        };
      } else {
        console.warn("Customer data returned an error:", data.customer.message);
      }
    }
    
    // Process vehicle data if it exists and is not an error
    if (data.vehicle) {
      if (!isSupabaseError(data.vehicle)) {
        safeVehicleData = {
          id: data.vehicle.id || DEFAULT_VEHICLE.id,
          make: data.vehicle.make || DEFAULT_VEHICLE.make,
          model: data.vehicle.model || DEFAULT_VEHICLE.model,
          license_plate: data.vehicle.license_plate || DEFAULT_VEHICLE.license_plate,
          year: data.vehicle.year || DEFAULT_VEHICLE.year,
          color: data.vehicle.color || DEFAULT_VEHICLE.color,
          vin: data.vehicle.vin || DEFAULT_VEHICLE.vin
        };
      } else {
        console.warn("Vehicle data returned an error:", data.vehicle.message);
      }
    }

    const agreement: FlattenType<SimpleAgreement> = {
      ...data,
      status: mapDatabaseStatus(data.status || ''),
      total_amount: data.total_amount || 0,
      agreement_number: data.agreement_number || '',
      customer: safeCustomerData,
      vehicle: safeVehicleData,
      customers: safeCustomerData,
      vehicles: safeVehicleData,
      total_cost: data.total_amount || 0
    };

    return agreement;
  };

  const getAgreements = async (filters?: any) => {
    let query = supabase
      .from('leases')
      .select(`
        *,
        customer:customer_id(id, full_name, email, phone, phone_number, address, driver_license),
        vehicle:vehicle_id(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.customerId || filters?.customer_id) {
      query = query.eq('customer_id', filters.customerId || filters.customer_id);
    }

    if (filters?.vehicleId || filters?.vehicle_id) {
      query = query.eq('vehicle_id', filters.vehicleId || filters.vehicle_id);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching agreements: ${error.message}`);
    }

    return (data || []).map(item => {
      // Initialize with default values
      let safeCustomerData = {...DEFAULT_CUSTOMER};
      let safeVehicleData = {...DEFAULT_VEHICLE};
      
      // Process customer data if it exists and is not an error
      if (item.customer) {
        if (!isSupabaseError(item.customer)) {
          safeCustomerData = {
            id: item.customer.id || DEFAULT_CUSTOMER.id,
            full_name: item.customer.full_name || DEFAULT_CUSTOMER.full_name,
            email: item.customer.email || DEFAULT_CUSTOMER.email,
            phone: item.customer.phone || item.customer.phone_number || DEFAULT_CUSTOMER.phone,
            phone_number: item.customer.phone_number || item.customer.phone || DEFAULT_CUSTOMER.phone_number,
            address: item.customer.address || DEFAULT_CUSTOMER.address,
            driver_license: item.customer.driver_license || DEFAULT_CUSTOMER.driver_license
          };
        } else {
          console.warn("Customer data returned an error:", item.customer.message);
        }
      }
      
      // Process vehicle data if it exists and is not an error
      if (item.vehicle) {
        if (!isSupabaseError(item.vehicle)) {
          safeVehicleData = {
            id: item.vehicle.id || DEFAULT_VEHICLE.id,
            make: item.vehicle.make || DEFAULT_VEHICLE.make,
            model: item.vehicle.model || DEFAULT_VEHICLE.model,
            license_plate: item.vehicle.license_plate || DEFAULT_VEHICLE.license_plate,
            year: item.vehicle.year || DEFAULT_VEHICLE.year,
            color: item.vehicle.color || DEFAULT_VEHICLE.color,
            vin: item.vehicle.vin || DEFAULT_VEHICLE.vin
          };
        } else {
          console.warn("Vehicle data returned an error:", item.vehicle.message);
        }
      }

      const agreement: FlattenType<SimpleAgreement> = {
        ...item,
        status: mapDatabaseStatus(item.status || ''),
        total_amount: item.total_amount || 0,
        agreement_number: item.agreement_number || '',
        customer: safeCustomerData,
        vehicle: safeVehicleData,
        customers: safeCustomerData,
        vehicles: safeVehicleData,
        total_cost: item.total_amount || 0
      };
      return agreement;
    });
  };

  return {
    agreements: agreementsQuery.data || [],
    isLoading: agreementsQuery.isLoading,
    error: agreementsQuery.error,
    useAgreementsList,
    getAgreement,
    getAgreements,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    searchParams,
    setSearchParams,
  };
};
