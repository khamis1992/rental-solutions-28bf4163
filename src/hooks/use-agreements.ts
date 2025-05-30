
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

// Updated SimpleAgreement interface to match database schema more closely
export interface SimpleAgreement {
  id: string;
  agreement_number: string | null;
  status: Database['public']['Tables']['leases']['Row']['status'];
  start_date: string;
  end_date: string;
  rent_amount: number;
  customer_id: string;
  vehicle_id: string | null;
  payment_frequency: string | null;
  payment_day: number | null;
  rent_due_day: number | null;
  confirmation_email_sent: boolean | null;
  daily_late_fee: number | null;
  deposit_amount: number | null;
  down_payment: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relationship data - these will be populated by joins
  customers: {
    id: string;
    full_name: string;
    email: string | null;
    phone_number: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    role: string | null;
    created_at: string | null;
    updated_at: string | null;
  } | null;
  vehicles: {
    id: string;
    make: string | null;
    model: string | null;
    license_plate: string | null;
    year: number | null;
    vin: string | null;
    color: string | null;
    status: string | null;
  } | null;
  // Computed fields for backward compatibility
  customer_name?: string;
  vehicle_info?: string;
}

// Type for the raw database response
type LeaseWithRelations = Database['public']['Tables']['leases']['Row'] & {
  customers: Database['public']['Tables']['profiles']['Row'] | null;
  vehicles: Database['public']['Tables']['vehicles']['Row'] | null;
};

// Transform function to convert database response to SimpleAgreement
function transformLeaseData(lease: LeaseWithRelations): SimpleAgreement {
  return {
    id: lease.id,
    agreement_number: lease.agreement_number,
    status: lease.status,
    start_date: lease.start_date,
    end_date: lease.end_date,
    rent_amount: lease.rent_amount,
    customer_id: lease.customer_id,
    vehicle_id: lease.vehicle_id,
    payment_frequency: lease.payment_frequency,
    payment_day: lease.payment_day,
    rent_due_day: lease.rent_due_day,
    confirmation_email_sent: lease.confirmation_email_sent,
    daily_late_fee: lease.daily_late_fee,
    deposit_amount: lease.deposit_amount,
    down_payment: lease.down_payment,
    notes: lease.notes,
    created_at: lease.created_at,
    updated_at: lease.updated_at,
    customers: lease.customers ? {
      id: lease.customers.id,
      full_name: lease.customers.full_name,
      email: lease.customers.email,
      phone_number: lease.customers.phone_number,
      address: lease.customers.address,
      city: lease.customers.city,
      state: lease.customers.state,
      zip_code: lease.customers.zip_code,
      role: lease.customers.role,
      created_at: lease.customers.created_at,
      updated_at: lease.customers.updated_at,
    } : null,
    vehicles: lease.vehicles ? {
      id: lease.vehicles.id,
      make: lease.vehicles.make,
      model: lease.vehicles.model,
      license_plate: lease.vehicles.license_plate,
      year: lease.vehicles.year,
      vin: lease.vehicles.vin,
      color: lease.vehicles.color,
      status: lease.vehicles.status,
    } : null,
    // Computed fields for backward compatibility
    customer_name: lease.customers?.full_name || 'Unknown Customer',
    vehicle_info: lease.vehicles ? 
      `${lease.vehicles.year || ''} ${lease.vehicles.make || ''} ${lease.vehicles.model || ''}`.trim() || 
      lease.vehicles.license_plate || 'Unknown Vehicle'
      : 'No Vehicle Assigned'
  };
}

export const useAgreements = () => {
  const query = useQuery({
    queryKey: ['agreements'],
    queryFn: async (): Promise<SimpleAgreement[]> => {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          customers:customer_id (
            id,
            full_name,
            email,
            phone_number,
            address,
            city,
            state,
            zip_code,
            role,
            created_at,
            updated_at
          ),
          vehicles:vehicle_id (
            id,
            make,
            model,
            license_plate,
            year,
            vin,
            color,
            status
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching agreements:', error);
        throw error;
      }

      // Transform the data to match our SimpleAgreement interface
      return (data || []).map(transformLeaseData);
    },
  });

  return {
    ...query,
    agreements: query.data || [],
    data: query.data || []
  };
};
