import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { handleApiError } from './use-api';
import { useDebounce } from '@/hooks/use-debounce';
import { checkAndCreateMissingPaymentSchedules } from '@/utils/agreement-utils';
import { fixAgreementPayments } from '@/lib/supabase';

// Define types for agreements and related data
export type LeaseStatus = 'active' | 'pending' | 'completed' | 'cancelled' | 'draft';
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'partially_paid' | 'refunded';

// Define the AgreementStatus export that's being imported in AgreementList.tsx
export const AgreementStatus = {
  ACTIVE: 'active',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
  CLOSED: 'closed',
  EXPIRED: 'expired',
  DRAFT: 'draft'
} as const;

// Define types for agreements and related data
export interface Agreement {
  id: string;
  agreement_number: string;
  customer_id: string;
  vehicle_id: string;
  status: LeaseStatus;
  start_date: Date | string;
  end_date: Date | string;
  rent_amount: number;
  total_amount: number;
  notes?: string;
  created_at: Date | string;
  updated_at: Date | string;
  payment_schedule_type?: 'monthly' | 'custom';
  rent_due_day?: number;
  daily_late_fee?: number;
  late_fee_grace_period?: number;
  security_deposit_amount?: number;
  security_deposit_refunded?: boolean;
  security_deposit_refund_date?: Date | string;
  security_deposit_notes?: string;
  payment_status?: PaymentStatus;
  is_test_data?: boolean;
}

export interface AgreementDocument {
  id: string;
  agreement_id?: string;
  document_type: string;
  document_url: string;
  created_at?: string;
}

export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  license_plate: string;
  year: number;
}

// Simplified types to avoid excessive nesting
export type AgreementWithDetails = {
  id: string;
  agreement_number?: string;
  customer_id?: string;
  vehicle_id?: string;
  status?: string;
  start_date?: Date | string;
  end_date?: Date | string;
  rent_amount?: number;
  total_amount?: number;
  notes?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
  payment_status?: string;
  rent_due_day?: number;
  daily_late_fee?: number;
  late_fee_grace_period?: number;
  security_deposit_amount?: number;
  security_deposit_refunded?: boolean;
  security_deposit_refund_date?: Date | string;
  security_deposit_notes?: string;
  payment_schedule_type?: 'monthly' | 'custom';
  is_test_data?: boolean;
  customer?: {
    id: string;
    full_name?: string;
    email?: string;
    phone_number?: string;
  };
  vehicle?: {
    id: string;
    make?: string;
    model?: string;
    license_plate?: string;
    year?: number;
  };
  documents?: AgreementDocument[];
};

export interface AgreementPayload {
  id: string;
  status?: LeaseStatus;
  payment_status?: PaymentStatus;
  security_deposit_refunded?: boolean;
  security_deposit_refund_date?: Date | string;
  security_deposit_notes?: string;
}

export interface AgreementFormValues {
  agreement_number: string;
  customer_id: string;
  vehicle_id: string;
  status: LeaseStatus;
  start_date: Date;
  end_date: Date;
  rent_amount: number;
  total_amount: number;
  notes?: string;
  rent_due_day?: number;
  daily_late_fee?: number;
  late_fee_grace_period?: number;
  security_deposit_amount?: number;
  security_deposit_refunded?: boolean;
  security_deposit_refund_date?: Date | string;
  security_deposit_notes?: string;
  payment_schedule_type?: 'monthly' | 'custom';
}

export interface AgreementImport {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'reverting' | 'reverted' | 'fixing';
  created_at: string;
  updated_at: string;
  total_records: number;
  processed_records: number;
  error_message?: string;
  file_name?: string;
  row_count?: number;
  error_count?: number;
}

// For backward compatibility
export type SimpleAgreement = AgreementWithDetails;

export const useAgreements = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // Add searchParams state to track filter params
  const [searchParams, setSearchParams] = useState({
    query: '',
    status: 'all',
    page: 1,
    pageSize: 10
  });

  // Add state for total count
  const [totalCount, setTotalCount] = useState(0);
  
  // Fetch all agreements
  const { data: agreements, isLoading, error, refetch } = useQuery({
    queryKey: ['agreements', searchParams],
    queryFn: async () => {
      try {
        // First get total count for pagination
        const countQuery = supabase
          .from('leases')
          .select('id', { count: 'exact', head: true });
        
        if (searchParams.query) {
          countQuery.ilike('agreement_number', `%${searchParams.query}%`);
        }
        
        if (searchParams.status && searchParams.status !== 'all') {
          countQuery.eq('status', searchParams.status);
        }
        
        const { count, error: countError } = await countQuery;
        
        if (countError) {
          console.error('Error counting agreements:', countError);
          throw new Error(`Failed to count agreements: ${countError.message}`);
        }
        
        setTotalCount(count || 0);
        
        // Now fetch the actual data with pagination
        let query = supabase
          .from('leases')
          .select(`
            id,
            agreement_number,
            customer_id,
            vehicle_id,
            status,
            start_date,
            end_date,
            rent_amount,
            total_amount,
            notes,
            created_at,
            updated_at,
            payment_status,
            is_test_data,
            profiles (
              id,
              full_name,
              email,
              phone_number
            ),
            vehicles (
              id,
              make,
              model,
              license_plate,
              year
            ),
            agreement_documents (
              id,
              agreement_id,
              document_type,
              document_url,
              created_at
            )
          `)
          .order('created_at', { ascending: false })
          .range(
            (searchParams.page - 1) * searchParams.pageSize,
            searchParams.page * searchParams.pageSize - 1
          );
          
        if (searchParams.query) {
          query = query.ilike('agreement_number', `%${searchParams.query}%`);
        }
        
        if (searchParams.status && searchParams.status !== 'all') {
          query = query.eq('status', searchParams.status);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching agreements:', error);
          throw new Error(`Failed to fetch agreements: ${error.message}`);
        }
        
        // Enhanced data transformation
        const transformedAgreements: AgreementWithDetails[] = data.map(agreement => ({
          id: agreement.id,
          agreement_number: agreement.agreement_number,
          customer_id: agreement.customer_id,
          vehicle_id: agreement.vehicle_id,
          status: agreement.status,
          start_date: agreement.start_date,
          end_date: agreement.end_date,
          rent_amount: agreement.rent_amount,
          total_amount: agreement.total_amount,
          notes: agreement.notes,
          created_at: agreement.created_at,
          updated_at: agreement.updated_at,
          payment_status: agreement.payment_status,
          is_test_data: agreement.is_test_data,
          customer: agreement.profiles ? {
            id: agreement.profiles.id,
            full_name: agreement.profiles.full_name,
            email: agreement.profiles.email,
            phone_number: agreement.profiles.phone_number
          } : undefined,
          vehicle: agreement.vehicles ? {
            id: agreement.vehicles.id,
            make: agreement.vehicles.make,
            model: agreement.vehicles.model,
            license_plate: agreement.vehicles.license_plate,
            year: agreement.vehicles.year
          } : undefined,
          documents: agreement.agreement_documents ? agreement.agreement_documents.map(doc => ({
            id: doc.id,
            agreement_id: doc.agreement_id,
            document_type: doc.document_type,
            document_url: doc.document_url,
            created_at: doc.created_at
          })) : []
        }));
        
        return transformedAgreements;
      } catch (error) {
        console.error('Error in agreements data fetching:', error);
        throw error;
      }
    },
  });
  
  // Get a single agreement by ID
  const getAgreement = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('leases')
        .select(`
          id,
          agreement_number,
          customer_id,
          vehicle_id,
          status,
          start_date,
          end_date,
          rent_amount,
          total_amount,
          notes,
          created_at,
          updated_at,
          payment_status,
          is_test_data,
          profiles (
            id,
            full_name,
            email,
            phone_number
          ),
          vehicles (
            id,
            make,
            model,
            license_plate,
            year
          ),
          agreement_documents (
            id,
            agreement_id,
            document_type,
            document_url,
            created_at
          )
        `)
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('Error fetching agreement:', error);
        throw new Error(`Failed to fetch agreement: ${error.message}`);
      }
      
      if (!data) {
        throw new Error(`Agreement not found with id: ${id}`);
      }
      
      // Transform the data to our expected format
      const transformedAgreement: AgreementWithDetails = {
        id: data.id,
        agreement_number: data.agreement_number,
        customer_id: data.customer_id,
        vehicle_id: data.vehicle_id,
        status: data.status,
        start_date: data.start_date,
        end_date: data.end_date,
        rent_amount: data.rent_amount,
        total_amount: data.total_amount,
        notes: data.notes,
        created_at: data.created_at,
        updated_at: data.updated_at,
        payment_status: data.payment_status,
        is_test_data: data.is_test_data,
        customer: data.profiles ? {
          id: data.profiles.id,
          full_name: data.profiles.full_name,
          email: data.profiles.email,
          phone_number: data.profiles.phone_number
        } : undefined,
        vehicle: data.vehicles ? {
          id: data.vehicles.id,
          make: data.vehicles.make,
          model: data.vehicles.model,
          license_plate: data.vehicles.license_plate,
          year: data.vehicles.year
        } : undefined,
        documents: data.agreement_documents ? data.agreement_documents.map(doc => ({
          id: doc.id,
          agreement_id: doc.agreement_id,
          document_type: doc.document_type,
          document_url: doc.document_url,
          created_at: doc.created_at
        })) : []
      };
      
      return transformedAgreement;
    } catch (error) {
      console.error('Error in agreement data fetching:', error);
      throw error;
    }
  };
  
  // Fetch a single agreement by ID
  const { data: agreement, isLoading: isAgreementLoading, error: agreementError } = useQuery({
    queryKey: ['agreements', 'single'],
    queryFn: async ({ queryKey }: { queryKey: string[] }) => {
      const id = queryKey[2]; // The third item should be the agreement ID
      if (!id) throw new Error("No agreement ID provided");
      
      try {
        const { data, error } = await supabase
          .from('leases')
          .select(`
            id,
            agreement_number,
            customer_id,
            vehicle_id,
            status,
            start_date,
            end_date,
            rent_amount,
            total_amount,
            notes,
            created_at,
            updated_at,
            rent_due_day,
            daily_late_fee,
            late_fee_grace_period,
            security_deposit_amount,
            security_deposit_refunded,
            security_deposit_refund_date,
            security_deposit_notes,
            payment_status,
            payment_schedule_type,
            is_test_data,
            profiles (
              id,
              full_name,
              email,
              phone_number
            ),
            vehicles (
              id,
              make,
              model,
              license_plate,
              year
            ),
            agreement_documents (
              id,
              agreement_id,
              document_type,
              document_url,
              created_at
            )
          `)
          .eq('id', id)
          .single();
          
        if (error) {
          console.error('Error fetching agreement:', error);
          throw new Error(`Failed to fetch agreement: ${error.message}`);
        }
        
        if (!data) {
          throw new Error(`Agreement not found with id: ${id}`);
        }
        
        // Enhanced data transformation
        const transformedAgreement: AgreementWithDetails = {
          id: data.id,
          agreement_number: data.agreement_number,
          customer_id: data.customer_id,
          vehicle_id: data.vehicle_id,
          status: data.status,
          start_date: data.start_date,
          end_date: data.end_date,
          rent_amount: data.rent_amount,
          total_amount: data.total_amount,
          notes: data.notes,
          created_at: data.created_at,
          updated_at: data.updated_at,
          rent_due_day: data.rent_due_day,
          daily_late_fee: data.daily_late_fee,
          late_fee_grace_period: data.late_fee_grace_period,
          security_deposit_amount: data.security_deposit_amount,
          security_deposit_refunded: data.security_deposit_refunded,
          security_deposit_refund_date: data.security_deposit_refund_date,
          security_deposit_notes: data.security_deposit_notes,
          payment_status: data.payment_status,
          payment_schedule_type: data.payment_schedule_type,
          is_test_data: data.is_test_data,
          customer: data.profiles ? {
            id: data.profiles.id,
            full_name: data.profiles.full_name,
            email: data.profiles.email,
            phone_number: data.profiles.phone_number
          } : undefined,
          vehicle: data.vehicles ? {
            id: data.vehicles.id,
            make: data.vehicles.make,
            model: data.vehicles.model,
            license_plate: data.vehicles.license_plate,
            year: data.vehicles.year
          } : undefined,
          documents: data.agreement_documents ? data.agreement_documents.map(doc => ({
            id: doc.id,
            agreement_id: doc.agreement_id,
            document_type: doc.document_type,
            document_url: doc.document_url,
            created_at: doc.created_at
          })) : []
        };
        
        return transformedAgreement;
      } catch (error) {
        console.error('Error in agreement data fetching:', error);
        throw error;
      }
    },
    enabled: false // Disable the query until the ID is available
  });
  
  // Create a new agreement
  const createAgreement = useMutation({
    mutationFn: async (values: AgreementFormValues) => {
      try {
        const { error } = await supabase
          .from('leases')
          .insert([
            {
              agreement_number: values.agreement_number,
              customer_id: values.customer_id,
              vehicle_id: values.vehicle_id,
              status: values.status,
              start_date: values.start_date.toISOString(),
              end_date: values.end_date.toISOString(),
              rent_amount: values.rent_amount,
              total_amount: values.total_amount,
              notes: values.notes,
              rent_due_day: values.rent_due_day,
              daily_late_fee: values.daily_late_fee,
              late_fee_grace_period: values.late_fee_grace_period,
              security_deposit_amount: values.security_deposit_amount,
              security_deposit_refunded: values.security_deposit_refunded,
              security_deposit_refund_date: values.security_deposit_refund_date,
              security_deposit_notes: values.security_deposit_notes,
              payment_schedule_type: values.payment_schedule_type
            }
          ]);
          
        if (error) {
          throw new Error(`Failed to create agreement: ${error.message}`);
        }
        
        return { success: true };
      } catch (error) {
        console.error('Error creating agreement:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create agreement', {
        description: error.message || 'An unexpected error occurred'
      });
    }
  });
  
  // Update an existing agreement
  const updateAgreement = useMutation({
    mutationFn: async ({ id, ...values }: AgreementFormValues & { id: string }) => {
      try {
        const { error } = await supabase
          .from('leases')
          .update({
            agreement_number: values.agreement_number,
            customer_id: values.customer_id,
            vehicle_id: values.vehicle_id,
            status: values.status,
            start_date: values.start_date.toISOString(),
            end_date: values.end_date.toISOString(),
            rent_amount: values.rent_amount,
            total_amount: values.total_amount,
            notes: values.notes,
            rent_due_day: values.rent_due_day,
            daily_late_fee: values.daily_late_fee,
            late_fee_grace_period: values.late_fee_grace_period,
            security_deposit_amount: values.security_deposit_amount,
            security_deposit_refunded: values.security_deposit_refunded,
            security_deposit_refund_date: values.security_deposit_refund_date,
            security_deposit_notes: values.security_deposit_notes,
            payment_schedule_type: values.payment_schedule_type
          })
          .eq('id', id);
          
        if (error) {
          throw new Error(`Failed to update agreement: ${error.message}`);
        }
        
        return { success: true };
      } catch (error) {
        console.error('Error updating agreement:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update agreement', {
        description: error.message || 'An unexpected error occurred'
      });
    }
  });
  
  // Update agreement status
  const updateAgreementStatus = useMutation({
    mutationFn: async ({ id, status, payment_status, security_deposit_refunded, security_deposit_refund_date, security_deposit_notes }: AgreementPayload) => {
      try {
        const updateData: {
          status: LeaseStatus;
          payment_status?: PaymentStatus;
          security_deposit_refunded?: boolean;
          security_deposit_refund_date?: string | null;
          security_deposit_notes?: string;
        } = { status };
        
        if (payment_status) {
          updateData.payment_status = payment_status;
        }
        
        if (security_deposit_refunded !== undefined) {
          updateData.security_deposit_refunded = security_deposit_refunded;
        }
        
        if (security_deposit_refund_date) {
          updateData.security_deposit_refund_date = (security_deposit_refund_date as string);
        } else {
          updateData.security_deposit_refund_date = null;
        }
        
        if (security_deposit_notes) {
          updateData.security_deposit_notes = security_deposit_notes;
        }
        
        const { error } = await supabase
          .from('leases')
          .update(updateData)
          .eq('id', id);
          
        if (error) {
          throw new Error(`Failed to update agreement status: ${error.message}`);
        }
        
        return { success: true };
      } catch (error) {
        console.error('Error updating agreement status:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement status updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update agreement status', {
        description: error.message || 'An unexpected error occurred'
      });
    }
  });
  
  // Delete an agreement
  const deleteAgreement = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('leases')
          .delete()
          .eq('id', id);
          
        if (error) {
          throw new Error(`Failed to delete agreement: ${error.message}`);
        }
        
        return { success: true };
      } catch (error) {
        console.error('Error deleting agreement:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete agreement', {
        description: error.message || 'An unexpected error occurred'
      });
    }
  });
  
  // Upload agreement document
  const uploadAgreementDocument = useMutation({
    mutationFn: async ({ agreementId, file, documentType }: { agreementId: string; file: File; documentType: string }) => {
      try {
        const fileName = `${documentType}-${uuidv4()}.${file.name.split('.').pop()}`;
        
        // Upload file to Supabase storage
        const { data: storageData, error: storageError } = await supabase
          .storage
          .from('agreement-documents')
          .upload(`${agreementId}/${fileName}`, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (storageError) {
          throw new Error(`Failed to upload document: ${storageError.message}`);
        }
        
        const documentUrl = `${supabase.supabaseUrl}/storage/v1/object/public/${storageData.Key}`;
        
        // Save document metadata to the database
        const { error: dbError } = await supabase
          .from('agreement_documents')
          .insert([
            {
              agreement_id: agreementId,
              document_type: documentType,
              document_url: documentUrl
            }
          ]);
          
        if (dbError) {
          // Attempt to delete the file from storage if DB insertion fails
          await supabase
            .storage
            .from('agreement-documents')
            .remove([`${agreementId}/${fileName}`]);
            
          throw new Error(`Failed to save document metadata: ${dbError.message}`);
        }
        
        return { success: true, documentUrl };
      } catch (error) {
        console.error('Error uploading agreement document:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement document uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to upload agreement document', {
        description: error.message || 'An unexpected error occurred'
      });
    }
  });
  
  // Delete agreement document
  const deleteAgreementDocument = useMutation({
    mutationFn: async (documentId: string) => {
      try {
        // Get the document URL from the database
        const { data: documentData, error: selectError } = await supabase
          .from('agreement_documents')
          .select('document_url, agreement_id')
          .eq('id', documentId)
          .single();
          
        if (selectError) {
          throw new Error(`Failed to get document URL: ${selectError.message}`);
        }
        
        if (!documentData?.document_url) {
          throw new Error('Document URL not found');
        }
        
        // Extract the file path from the URL
        const filePath = documentData.document_url.replace(`${supabase.supabaseUrl}/storage/v1/object/public/`, '');
        
        // Delete the document metadata from the database
        const { error: deleteDbError } = await supabase
          .from('agreement_documents')
          .delete()
          .eq('id', documentId);
          
        if (deleteDbError) {
          throw new Error(`Failed to delete document metadata: ${deleteDbError.message}`);
        }
        
        // Delete the file from Supabase storage
        const { error: storageError } = await supabase
          .storage
          .from('agreement-documents')
          .remove([filePath]);
          
        if (storageError) {
          console.warn(`Failed to delete document from storage: ${storageError.message}`);
          // Optionally, don't throw an error here, as the DB record is already deleted
        }
        
        return { success: true };
      } catch (error) {
        console.error('Error deleting agreement document:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement document deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete agreement document', {
        description: error.message || 'An unexpected error occurred'
      });
    }
  });
  
  // Fetch agreement imports
  const { data: agreementImports, isLoading: isAgreementImportsLoading, error: agreementImportsError, refetch: refetchAgreementImports } = useQuery({
    queryKey: ['agreementImports'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('agreement_imports')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching agreement imports:', error);
          throw new Error(`Failed to fetch agreement imports: ${error.message}`);
        }
        
        return data as AgreementImport[];
      } catch (error) {
        console.error('Error in agreement imports data fetching:', error);
        throw error;
      }
    }
  });
  
  // Upload agreement import file
  const uploadAgreementImportFile = useMutation({
    mutationFn: async (file: File) => {
      try {
        // Generate a unique import ID
        const importId = uuidv4();
        
        // Create a new import record in the database
        const { error: createError } = await supabase
          .from('agreement_imports')
          .insert([
            {
              id: importId,
              filename: file.name,
              status: 'pending',
              total_records: 0, // Initial value, will be updated later
              processed_records: 0
            }
          ]);
          
        if (createError) {
          throw new Error(`Failed to create import record: ${createError.message}`);
        }
        
        // Upload file to Supabase storage
        const { data: storageData, error: storageError } = await supabase
          .storage
          .from('agreement-imports')
          .upload(`${importId}/${file.name}`, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (storageError) {
          // If storage upload fails, delete the import record
          await supabase
            .from('agreement_imports')
            .delete()
            .eq('id', importId);
            
          throw new Error(`Failed to upload import file: ${storageError.message}`);
        }
        
        const importUrl = `${supabase.supabaseUrl}/storage/v1/object/public/${storageData.Key}`;
        
        // Start processing the import (call the function)
        const { error: processError } = await supabase.functions.invoke('process-agreement-import', {
          body: {
            import_id: importId,
            import_url: importUrl
          }
        });
        
        if (processError) {
          // If processing fails, attempt to delete the file from storage and the import record
          await supabase
            .storage
            .from('agreement-imports')
            .remove([`${importId}/${file.name}`]);
            
          await supabase
            .from('agreement_imports')
            .delete()
            .eq('id', importId);
            
          throw new Error(`Failed to start import processing: ${processError.message}`);
        }
        
        return { success: true, importId };
      } catch (error) {
        console.error('Error uploading agreement import file:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreementImports'] });
      toast.success('Agreement import started successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to upload agreement import file', {
        description: error.message || 'An unexpected error occurred'
      });
    }
  });
  
  // Fetch a single agreement import by ID
  const fetchAgreementImport = useCallback(async (importId: string) => {
    try {
      const { data, error } = await supabase
        .from('agreement_imports')
        .select('*')
        .eq('id', importId)
        .single();
        
      if (error) {
        console.error('Error fetching agreement import:', error);
        throw new Error(`Failed to fetch agreement import: ${error.message}`);
      }
      
      return data as AgreementImport;
    } catch (error) {
      console.error('Error in agreement import data fetching:', error);
      throw error;
    }
  }, []);
  
  // Function to get the progress of an agreement import
  const getAgreementImportProgress = useCallback(async (importId: string) => {
    try {
      const importData = await fetchAgreementImport(importId);
      
      if (!importData) {
        throw new Error('Import not found');
      }
      
      const progress = importData.total_records > 0
        ? (importData.processed_records / importData.total_records) * 100
        : 0;
        
      return {
        status: importData.status,
        progress: progress,
        totalRecords: importData.total_records,
        processedRecords: importData.processed_records,
        errorMessage: importData.error_message
      };
    } catch (error) {
      console.error('Error getting agreement import progress:', error);
      return {
        status: 'failed',
        progress: 0,
        totalRecords: 0,
        processedRecords: 0,
        errorMessage: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    }
  }, [fetchAgreementImport]);
  
  return {
    agreements,
    agreement,
    agreementImports,
    isLoading,
    isAgreementLoading,
    isAgreementImportsLoading,
    error,
    agreementError,
    agreementImportsError,
    refetch,
    refetchAgreementImports,
    createAgreement,
    updateAgreement,
    updateAgreementStatus,
    deleteAgreement,
    uploadAgreementDocument,
    deleteAgreementDocument,
    uploadAgreementImportFile,
    fetchAgreementImport,
    getAgreementImportProgress,
    setSearchTerm,
    searchParams,
    setSearchParams,
    getAgreement,
    totalCount
  };
};
