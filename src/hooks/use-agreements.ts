import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Agreement, AgreementStatus, forceGeneratePaymentForAgreement } from '@/lib/validation-schemas/agreement';
import { asSimplifiedLease, mapDatabaseRowToLease, SimplifiedLeaseType } from '@/lib/utils-type';

export type SimpleAgreement = SimplifiedLeaseType;

export type AgreementFilters = {
  status?: string;
  customerId?: string;
  vehicleId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  query?: string;
};

type SearchParams = {
  query?: string;
  status?: string;
  vehicleId?: string;
  customerId?: string;
};

export const useAgreements = (initialFilters?: AgreementFilters) => {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: initialFilters?.query || '',
    status: initialFilters?.status || 'all',
    vehicleId: initialFilters?.vehicleId || '',
    customerId: initialFilters?.customerId || ''
  });
  const isLoading = loading;

  const fetchAgreements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('leases')
        .select(`
          *,
          customers:customer_id (id, full_name, phone, email),
          vehicles:vehicle_id (id, make, model, year, license_plate)
        `);

      const filters = { ...initialFilters };
      if (searchParams.query) {
        filters.search = searchParams.query;
      }
      if (searchParams.status && searchParams.status !== 'all') {
        filters.status = searchParams.status;
      }
      
      if (filters) {
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.customerId) {
          query = query.eq('customer_id', filters.customerId);
        }
        if (filters.vehicleId) {
          query = query.eq('vehicle_id', filters.vehicleId);
        }
        if (filters.startDate) {
          query = query.gte('start_date', filters.startDate.toISOString());
        }
        if (filters.endDate) {
          query = query.lte('end_date', filters.endDate.toISOString());
        }
        if (filters.search) {
          query = query.or(`agreement_number.ilike.%${filters.search}%,customers.full_name.ilike.%${filters.search}%,vehicles.license_plate.ilike.%${filters.search}%`);
        }
      }

      const { count: totalRecords } = await supabase
        .from('leases')
        .select('*', { count: 'exact', head: true });

      setTotalCount(totalRecords || 0);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData = data.map((lease) => {
        const safeLeaseData = mapDatabaseRowToLease(lease);
        
        return {
          ...safeLeaseData,
          start_date: new Date(lease.start_date),
          end_date: new Date(lease.end_date),
          customer_name: lease.customers?.full_name || 'Unknown',
          license_plate: lease.vehicles?.license_plate || 'Unknown',
          vehicle_make: lease.vehicles?.make || 'Unknown',
          vehicle_model: lease.vehicles?.model || 'Unknown',
          vehicle_year: lease.vehicles?.year || 'Unknown',
          created_at: lease.created_at ? new Date(lease.created_at) : undefined,
          updated_at: lease.updated_at ? new Date(lease.updated_at) : undefined,
          terms_accepted: lease.terms_accepted || false,
        } as Agreement;
      });

      setAgreements(transformedData);
    } catch (err) {
      console.error('Error fetching agreements:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error('Failed to load agreements');
    } finally {
      setLoading(false);
    }
  }, [initialFilters, searchParams]);

  useEffect(() => {
    fetchAgreements();
  }, [fetchAgreements]);

  const getAgreementById = useCallback(async (id: string): Promise<Agreement | null> => {
    try {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          *,
          customers:customer_id (id, full_name, phone, email, id_number, id_type, nationality),
          vehicles:vehicle_id (id, make, model, year, license_plate, vin, color)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      const safeLeaseData = mapDatabaseRowToLease(data);
      
      return {
        ...safeLeaseData,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        customer_name: data.customers?.full_name || 'Unknown',
        license_plate: data.vehicles?.license_plate || 'Unknown',
        vehicle_make: data.vehicles?.make || 'Unknown',
        vehicle_model: data.vehicles?.model || 'Unknown',
        vehicle_year: data.vehicles?.year || 'Unknown',
        created_at: data.created_at ? new Date(data.created_at) : undefined,
        updated_at: data.updated_at ? new Date(data.updated_at) : undefined,
        terms_accepted: data.terms_accepted || false,
      } as Agreement;
    } catch (err) {
      console.error('Error fetching agreement by ID:', err);
      toast.error('Failed to load agreement details');
      return null;
    }
  }, []);

  const getAgreement = getAgreementById;

  const createAgreement = useCallback(async (agreementData: Partial<Agreement>): Promise<Agreement | null> => {
    try {
      if (!agreementData.customer_id || !agreementData.vehicle_id || !agreementData.start_date || !agreementData.end_date) {
        throw new Error('Missing required fields for agreement');
      }

      const { data, error } = await supabase
        .from('leases')
        .insert({
          customer_id: agreementData.customer_id,
          vehicle_id: agreementData.vehicle_id,
          start_date: agreementData.start_date.toISOString(),
          end_date: agreementData.end_date.toISOString(),
          status: agreementData.status || AgreementStatus.DRAFT,
          agreement_number: agreementData.agreement_number,
          total_amount: agreementData.total_amount,
          rent_amount: agreementData.rent_amount,
          deposit_amount: agreementData.deposit_amount,
          daily_late_fee: agreementData.daily_late_fee,
          agreement_duration: agreementData.agreement_duration,
          notes: agreementData.notes,
          terms_accepted: agreementData.terms_accepted || false,
          signature_url: agreementData.signature_url,
          additional_drivers: agreementData.additional_drivers,
        })
        .select()
        .single();

      if (error) throw error;

      if (data && agreementData.status === AgreementStatus.ACTIVE) {
        const { error: vehicleError } = await supabase
          .from('vehicles')
          .update({ status: 'rented' })
          .eq('id', agreementData.vehicle_id);

        if (vehicleError) {
          console.error('Error updating vehicle status:', vehicleError);
          toast.error('Agreement created but failed to update vehicle status');
        }
      }

      toast.success('Agreement created successfully');
      fetchAgreements();

      const safeLeaseData = mapDatabaseRowToLease(data);
      
      return {
        ...safeLeaseData,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        created_at: data.created_at ? new Date(data.created_at) : undefined,
        updated_at: data.updated_at ? new Date(data.updated_at) : undefined,
        terms_accepted: data.terms_accepted || false,
      } as Agreement;
    } catch (err) {
      console.error('Error creating agreement:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create agreement');
      return null;
    }
  }, [supabase, fetchAgreements]);

  const updateAgreement = useCallback(async (id: string, agreementData: Partial<Agreement>): Promise<boolean> => {
    try {
      const { data: currentAgreement, error: fetchError } = await supabase
        .from('leases')
        .select('status, vehicle_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const updateData: any = {};
      
      if (agreementData.customer_id) updateData.customer_id = agreementData.customer_id;
      if (agreementData.vehicle_id) updateData.vehicle_id = agreementData.vehicle_id;
      if (agreementData.start_date) updateData.start_date = agreementData.start_date.toISOString();
      if (agreementData.end_date) updateData.end_date = agreementData.end_date.toISOString();
      if (agreementData.status) updateData.status = agreementData.status;
      if (agreementData.agreement_number) updateData.agreement_number = agreementData.agreement_number;
      if (agreementData.total_amount !== undefined) updateData.total_amount = agreementData.total_amount;
      if (agreementData.rent_amount !== undefined) updateData.rent_amount = agreementData.rent_amount;
      if (agreementData.deposit_amount !== undefined) updateData.deposit_amount = agreementData.deposit_amount;
      if (agreementData.daily_late_fee !== undefined) updateData.daily_late_fee = agreementData.daily_late_fee;
      if (agreementData.agreement_duration) updateData.agreement_duration = agreementData.agreement_duration;
      if (agreementData.notes !== undefined) updateData.notes = agreementData.notes;
      if (agreementData.terms_accepted !== undefined) updateData.terms_accepted = agreementData.terms_accepted;
      if (agreementData.signature_url !== undefined) updateData.signature_url = agreementData.signature_url;
      if (agreementData.additional_drivers) updateData.additional_drivers = agreementData.additional_drivers;

      const { error } = await supabase
        .from('leases')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      if (agreementData.status && agreementData.status !== currentAgreement.status) {
        const vehicleId = agreementData.vehicle_id || currentAgreement.vehicle_id;
        
        let vehicleStatus = 'available';
        if (agreementData.status === AgreementStatus.ACTIVE) {
          vehicleStatus = 'rented';
        } else if (agreementData.status === AgreementStatus.PENDING) {
          vehicleStatus = 'reserved';
        }

        const { error: vehicleError } = await supabase
          .from('vehicles')
          .update({ status: vehicleStatus })
          .eq('id', vehicleId);

        if (vehicleError) {
          console.error('Error updating vehicle status:', vehicleError);
          toast.error('Agreement updated but failed to update vehicle status');
        }
      }

      toast.success('Agreement updated successfully');
      fetchAgreements();
      return true;
    } catch (err) {
      console.error('Error updating agreement:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update agreement');
      return false;
    }
  }, [supabase, fetchAgreements]);

  const deleteAgreement = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { data: agreement, error: fetchError } = await supabase
        .from('leases')
        .select('vehicle_id, status')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('leases')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (agreement && agreement.status === AgreementStatus.ACTIVE) {
        const { error: vehicleError } = await supabase
          .from('vehicles')
          .update({ status: 'available' })
          .eq('id', agreement.vehicle_id);

        if (vehicleError) {
          console.error('Error updating vehicle status:', vehicleError);
          toast.error('Agreement deleted but failed to update vehicle status');
        }
      }

      toast.success('Agreement deleted successfully');
      fetchAgreements();
      return true;
    } catch (err) {
      console.error('Error deleting agreement:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete agreement');
      return false;
    }
  }, [supabase, fetchAgreements]);

  const deleteAgreementWithMutate = Object.assign(deleteAgreement, {
    mutateAsync: deleteAgreement
  });

  const generatePaymentSchedule = useCallback(async (agreementId: string): Promise<boolean> => {
    try {
      const result = await forceGeneratePaymentForAgreement(supabase, agreementId);
      
      if (result.success) {
        toast.success(result.message || 'Payment schedule generated successfully');
        return true;
      } else {
        toast.error(result.message || 'Failed to generate payment schedule');
        return false;
      }
    } catch (err) {
      console.error('Error generating payment schedule:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to generate payment schedule');
      return false;
    }
  }, [supabase]);

  return {
    agreements,
    loading,
    isLoading,
    error,
    totalCount,
    fetchAgreements,
    getAgreementById,
    getAgreement,
    createAgreement,
    updateAgreement,
    deleteAgreement: deleteAgreementWithMutate,
    generatePaymentSchedule,
    searchParams,
    setSearchParams,
  };
};
