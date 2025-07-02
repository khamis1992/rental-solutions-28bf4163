
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Agreement } from '@/types/agreement';

export interface SimpleAgreement {
  id: string;
  agreement_number?: string;
  status: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  customer_id: string;
  vehicle_id?: string;
  customer_name?: string;
  vehicle_info?: string;
  created_at?: string;
  updated_at?: string;
  payment_frequency?: string;
  rent_due_day?: number;
  payment_day?: number;
  confirmation_email_sent?: boolean;
  daily_late_fee?: number;
  deposit_amount?: number;
  down_payment?: number;
  notes?: string;
  customers?: {
    id: string;
    full_name: string;
    email?: string;
    phone_number?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    role?: string;
    created_at?: string;
    updated_at?: string;
  };
  vehicles?: {
    id?: string;
    make?: string;
    model?: string;
    license_plate?: string;
    year?: number;
    vin?: string;
    color?: string;
    status?: string;
  };
}

export const useAgreementsFixed = () => {
  const query = useQuery({
    queryKey: ['agreements-fixed'],
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

      return data || [];
    },
  });

  return {
    ...query,
    agreements: query.data || [],
    data: query.data || []
  };
};
