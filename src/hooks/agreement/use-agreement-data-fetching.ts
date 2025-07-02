
// @ts-nocheck
/* eslint-disable */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Agreement } from '@/types/agreement';

export interface AgreementWithRelations {
  id: string;
  agreement_number: string | null;
  status: string;
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
  total_amount: number;
  agreement_type: string;
  customers: {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    role: string;
    created_at: string;
    updated_at: string;
    driver_license?: string;
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
}

export function useAgreementDataFetching(agreementId?: string) {
  return useQuery({
    queryKey: ['agreement-detail', agreementId],
    queryFn: async (): Promise<Agreement | null> => {
      if (!agreementId) return null;

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
            updated_at,
            driver_license
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
        .eq('id', agreementId)
        .single();

      if (error) {
        console.error('Error fetching agreement:', error);
        throw error;
      }

      if (!data) return null;

      // Transform the data to match Agreement interface
      const agreement: Agreement = {
        id: data.id,
        agreement_number: data.agreement_number,
        status: data.status,
        start_date: data.start_date,
        end_date: data.end_date,
        rent_amount: data.rent_amount,
        customer_id: data.customer_id,
        vehicle_id: data.vehicle_id,
        payment_frequency: data.payment_frequency,
        payment_day: data.payment_day,
        rent_due_day: data.rent_due_day,
        confirmation_email_sent: data.confirmation_email_sent,
        daily_late_fee: data.daily_late_fee,
        deposit_amount: data.deposit_amount,
        down_payment: data.down_payment,
        notes: data.notes,
        created_at: data.created_at,
        updated_at: data.updated_at,
        total_amount: data.total_amount || data.rent_amount,
        agreement_type: data.agreement_type || 'short_term',
        customers: data.customers ? {
          id: data.customers.id,
          full_name: data.customers.full_name,
          email: data.customers.email || '',
          phone_number: data.customers.phone_number || '',
          address: data.customers.address || '',
          city: data.customers.city || '',
          state: data.customers.state || '',
          zip_code: data.customers.zip_code || '',
          role: data.customers.role || 'customer',
          created_at: data.customers.created_at || '',
          updated_at: data.customers.updated_at || '',
          driver_license: data.customers.driver_license || ''
        } : undefined,
        vehicles: data.vehicles ? {
          ...data.vehicles,
          attention_needed_notes: '',
          engine_number: '',
          model_number: '',
          notes: '',
          created_at: '',
          updated_at: '',
          vin: data.vehicles.vin || ''
        } : undefined
      };

      return agreement;
    },
    enabled: !!agreementId,
  });
}
