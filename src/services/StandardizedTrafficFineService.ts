/**
 * Standardized Traffic Fines Service
 * Handles traffic fines management and related operations
 */
import { supabase } from '@/lib/supabase';
import { BaseService } from './BaseService';
import {
  TrafficFine,
  TrafficFineInsert,
  TrafficFineUpdate,
  TrafficFineStatus,
  ViolationType,
  PaginatedTrafficFineResult,
  TrafficFineStatistics,
  TrafficFineValidation
} from '@/types/traffic-fine.types';
import { handleError } from '@/utils/error-handler';
import { validateData } from '@/utils/validation';
import {
  trafficFineSchema,
  trafficFineInsertSchema,
  trafficFineUpdateSchema,
  paymentDetailsSchema
} from '@/schemas/traffic-fine.schema';

/**
 * Service for managing traffic fines
 */
export class TrafficFineService extends BaseService {
  constructor() {
    super('traffic_fines');
  }

  /**
   * Get traffic fines with filtering and pagination
   */
  async getTrafficFines(
    filters: {
      vehicleId?: string;
      agreementId?: string;
      customerId?: string;
      status?: TrafficFineStatus | TrafficFineStatus[];
      violationType?: ViolationType;
      licensePlate?: string;
      fromDate?: Date;
      toDate?: Date;
      searchTerm?: string;
    } = {},
    limit = 10,
    offset = 0
  ): Promise<PaginatedTrafficFineResult | null> {
    try {
      // Start building the query
      let query = supabase.from('traffic_fines').select(`
        *,
        vehicle:vehicle_id(*),
        agreement:agreement_id(*),
        customer:customer_id(*)
      `, { count: 'exact' });

      // Apply filters
      if (filters.vehicleId) {
        query = query.eq('vehicle_id', filters.vehicleId);
      }

      if (filters.agreementId) {
        query = query.eq('agreement_id', filters.agreementId);
      }

      if (filters.customerId) {
        query = query.eq('customer_id', filters.customerId);
      }

      if (filters.licensePlate) {
        query = query.eq('license_plate', filters.licensePlate);
      }

      if (filters.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters.violationType) {
        query = query.eq('violation_type', filters.violationType);
      }

      if (filters.fromDate) {
        query = query.gte('violation_date', filters.fromDate.toISOString());
      }

      if (filters.toDate) {
        query = query.lte('violation_date', filters.toDate.toISOString());
      }

      if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        const searchTerm = filters.searchTerm.trim();
        query = query.or(
          `license_plate.ilike.%${searchTerm}%,violation_location.ilike.%${searchTerm}%,reference_number.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`
        );
      }

      // Apply pagination
      const { data, error, count } = await query
        .order('violation_date', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return {
        data: data as TrafficFine[],
        count: count || 0
      };
    } catch (error) {
      handleError(error, { context: 'Traffic fine listing' });
      return null;
    }
  }

  /**
   * Get a single traffic fine by ID
   */
  async getTrafficFineById(id: string): Promise<TrafficFine | null> {
    try {
      const { data, error } = await supabase
        .from('traffic_fines')
        .select(`
          *,
          vehicle:vehicle_id(*),
          agreement:agreement_id(*),
          customer:customer_id(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return data as TrafficFine;
    } catch (error) {
      handleError(error, { context: 'Traffic fine details' });
      return null;
    }
  }
  /**
   * Create a new traffic fine
   */
  async createTrafficFine(data: TrafficFineInsert): Promise<TrafficFine | null> {
    try {
      // Validate the input data
      const validatedData = validateData(trafficFineInsertSchema, data, {
        context: 'Traffic fine creation',
        throwOnError: true
      });
      
      if (!validatedData) return null;
      
      const { data: newFine, error } = await supabase
        .from('traffic_fines')
        .insert({
          ...validatedData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return newFine as TrafficFine;
    } catch (error) {
      handleError(error, { context: 'Create traffic fine' });
      return null;
    }
  }
  /**
   * Update an existing traffic fine
   */
  async updateTrafficFine(id: string, data: TrafficFineUpdate): Promise<TrafficFine | null> {
    try {
      // Validate the input data
      const validatedData = validateData(trafficFineUpdateSchema, data, {
        context: 'Traffic fine update',
        throwOnError: true
      });
      
      if (!validatedData) return null;
      
      const { data: updatedFine, error } = await supabase
        .from('traffic_fines')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return updatedFine as TrafficFine;
    } catch (error) {
      handleError(error, { context: 'Update traffic fine' });
      return null;
    }
  }

  /**
   * Delete a traffic fine
   */
  async deleteTrafficFine(id: string): Promise<TrafficFine | null> {
    try {
      const { data: deletedFine, error } = await supabase
        .from('traffic_fines')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return deletedFine as TrafficFine;
    } catch (error) {
      handleError(error, { context: 'Delete traffic fine' });
      return null;
    }
  }
  /**
   * Update traffic fine status
   */
  async updateTrafficFineStatus(
    id: string, 
    status: TrafficFineStatus,
    paymentDetails?: {
      paymentDate: Date;
      paymentReference?: string;
      paymentReceiptUrl?: string;
    }
  ): Promise<TrafficFine | null> {
    try {
      // Validate status
      if (!Object.values(TrafficFineStatus).includes(status)) {
        throw new Error(`Invalid traffic fine status: ${status}`);
      }
      
      // Validate payment details if provided
      if (paymentDetails) {
        validateData(paymentDetailsSchema, paymentDetails, {
          context: 'Payment details',
          throwOnError: true
        });
      }
      
      let updateData: any = { status };
      
      // Add payment details if provided
      if (paymentDetails && status === TrafficFineStatus.PAID) {
        updateData.payment_date = paymentDetails.paymentDate.toISOString();
        
        if (paymentDetails.paymentReference) {
          updateData.reference_number = paymentDetails.paymentReference;
        }
        
        if (paymentDetails.paymentReceiptUrl) {
          updateData.payment_receipt_url = paymentDetails.paymentReceiptUrl;
        }
      }
      
      const { data, error } = await supabase
        .from('traffic_fines')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as TrafficFine;
    } catch (error) {
      handleError(error, { context: 'Update traffic fine status' });
      return null;
    }
  }

  /**
   * Get traffic fine statistics
   */
  async getTrafficFineStatistics(): Promise<TrafficFineStatistics | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_traffic_fine_statistics');

      if (error) {
        throw error;
      }

      return data as TrafficFineStatistics;
    } catch (error) {
      handleError(error, { context: 'Traffic fine statistics' });
      return null;
    }
  }

  /**
   * Get traffic fines for a specific vehicle
   */
  async getVehicleTrafficFines(vehicleId: string): Promise<TrafficFine[] | null> {
    try {
      const { data, error } = await supabase
        .from('traffic_fines')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('violation_date', { ascending: false });

      if (error) {
        throw error;
      }

      return data as TrafficFine[];
    } catch (error) {
      handleError(error, { context: 'Vehicle traffic fines' });
      return null;
    }
  }

  /**
   * Get traffic fines for a specific customer
   */
  async getCustomerTrafficFines(customerId: string): Promise<TrafficFine[] | null> {
    try {
      const { data, error } = await supabase
        .from('traffic_fines')
        .select('*')
        .eq('customer_id', customerId)
        .order('violation_date', { ascending: false });

      if (error) {
        throw error;
      }

      return data as TrafficFine[];
    } catch (error) {
      handleError(error, { context: 'Customer traffic fines' });
      return null;
    }
  }

  /**
   * Validate traffic fines for a license plate
   */
  async validateTrafficFines(
    licensePlate: string, 
    batchId?: string
  ): Promise<TrafficFineValidation | null> {
    try {
      // Call the RPC function to validate traffic fines
      const { data, error } = await supabase
        .rpc('validate_traffic_fines', { 
          p_license_plate: licensePlate,
          p_batch_id: batchId || crypto.randomUUID()
        });

      if (error) {
        throw error;
      }

      return data as TrafficFineValidation;
    } catch (error) {
      handleError(error, { context: 'Traffic fine validation' });
      return null;
    }
  }

  /**
   * Bulk validate traffic fines for multiple vehicles
   */
  async bulkValidateTrafficFines(
    licensePlates: string[]
  ): Promise<{ batchId: string, count: number } | null> {
    try {
      const batchId = crypto.randomUUID();
      
      // Process each license plate
      const promises = licensePlates.map(licensePlate => 
        this.validateTrafficFines(licensePlate, batchId)
      );
      
      await Promise.all(promises);
      
      return { 
        batchId,
        count: licensePlates.length
      };
    } catch (error) {
      handleError(error, { context: 'Bulk traffic fine validation' });
      return null;
    }
  }

  /**
   * Get validation results for a batch
   */
  async getValidationResults(
    batchId: string
  ): Promise<TrafficFineValidation[] | null> {
    try {
      const { data, error } = await supabase
        .from('traffic_fine_validations')
        .select('*')
        .eq('batch_id', batchId)
        .order('validation_date', { ascending: false });

      if (error) {
        throw error;
      }

      return data as TrafficFineValidation[];
    } catch (error) {
      handleError(error, { context: 'Get validation results' });
      return null;
    }
  }
}

// Export a singleton instance
export const trafficFineService = new TrafficFineService();
