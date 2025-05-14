import { BaseService } from './BaseService';
import { Vehicle, VehicleFilterParams } from '@/types/vehicle';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/utils/error-handler';

export interface PaginatedResult<T> {
  data: T[];
  count: number;
}

/**
 * Service for managing vehicle data
 */
export class VehicleService extends BaseService {
  constructor() {
    super('vehicles');
  }

  /**
   * Get all vehicles with filtering and pagination
   */
  async getVehicles(filters: VehicleFilterParams = {}): Promise<PaginatedResult<Vehicle> | null> {
    try {
      const {
        status,
        statuses,
        make,
        model,
        year,
        minYear,
        maxYear,
        searchTerm,
        sortBy = 'created_at',
        sortDirection = 'desc',
        location,
        vehicle_type_id,
        limit = 10,
        offset = 0
      } = filters;

      // Start building the query
      let query = this.query.select('*, vehicle_types(*)');

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }

      if (statuses && statuses.length > 0) {
        query = query.in('status', statuses);
      }

      if (make) {
        query = query.ilike('make', `%${make}%`);
      }

      if (model) {
        query = query.ilike('model', `%${model}%`);
      }

      if (year) {
        query = query.eq('year', year);
      }

      if (minYear) {
        query = query.gte('year', minYear);
      }

      if (maxYear) {
        query = query.lte('year', maxYear);
      }

      if (location) {
        query = query.eq('location', location);
      }

      if (vehicle_type_id) {
        query = query.eq('vehicle_type_id', vehicle_type_id);
      }

      // Text search across multiple fields
      if (searchTerm) {
        query = query.or(
          `license_plate.ilike.%${searchTerm}%,make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%,vin.ilike.%${searchTerm}%`
        );
      }

      // Get total count (without pagination)
      const { count, error: countError } = await query.count();
      
      if (countError) {
        throw countError;
      }

      // Apply sorting and pagination
      query = query
        .order(sortBy, { ascending: sortDirection === 'asc' })
        .range(offset, offset + limit - 1);

      // Execute query
      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return {
        data: data.map(vehicle => ({
          ...vehicle,
          vehicleType: vehicle.vehicle_types,
        })) as Vehicle[],
        count: count || 0
      };
    } catch (error) {
      handleError(error, { context: 'Vehicle listing' });
      return null;
    }
  }

/**
 * Service responsible for managing vehicle operations in the fleet management system.
 * Handles vehicle data management, status updates, and fleet analytics.
 */
export class VehicleService extends BaseService<'vehicles'> {
  constructor() {
    super(vehicleRepository);
  }

  /**
   * Finds vehicles based on specified filtering criteria with pagination
   * @param filters - Optional filtering parameters for vehicle search
   * @returns Promise with filtered vehicle records and total count
   * @throws Error if database operation fails
   */
  async findVehicles(filters?: VehicleFilterParams): Promise<ServiceResult<PaginatedResult<Vehicle>>> {
    return handleServiceOperation(async () => {
      console.log("VehicleService.findVehicles called with filters:", filters);
      
      // For count query - We'll use this to get total records without pagination
      let countQuery = supabase.from('vehicles').select('id', { count: 'exact', head: true });
      
      // For data query with pagination and full details
      let dataQuery = supabase.from('vehicles')
        .select('*, vehicle_types(*)');
      
      if (filters) {
        // Apply filters to both queries
        if (filters.statuses && Array.isArray(filters.statuses) && filters.statuses.length > 0) {
          console.log("Filtering by statuses:", filters.statuses);
          // Map each status to its database representation
          const dbStatuses = filters.statuses.map(status => asVehicleStatus(status));
          countQuery = countQuery.in('status', dbStatuses);
          dataQuery = dataQuery.in('status', dbStatuses);
          console.log("Mapped to DB statuses:", dbStatuses);
        } else if (filters.status) {
          console.log("Filtering by single status:", filters.status);
          const dbStatus = asVehicleStatus(filters.status);
          countQuery = countQuery.eq('status', dbStatus);
          dataQuery = dataQuery.eq('status', dbStatus);
        }
        
        // Apply other filters to both queries
        if (filters.make) {
          countQuery = countQuery.eq('make', filters.make);
          dataQuery = dataQuery.eq('make', filters.make);
        }
        if (filters.model) {
          countQuery = countQuery.eq('model', filters.model);
          dataQuery = dataQuery.eq('model', filters.model);
        }
        if (filters.year) {
          countQuery = countQuery.eq('year', filters.year);
          dataQuery = dataQuery.eq('year', filters.year);
        }
        if (filters.location) {
          countQuery = countQuery.eq('location', filters.location);
          dataQuery = dataQuery.eq('location', filters.location);
        }
        if (filters.vehicle_type_id) {
          countQuery = countQuery.eq('vehicle_type_id', filters.vehicle_type_id);
          dataQuery = dataQuery.eq('vehicle_type_id', filters.vehicle_type_id);
        }
        
        if (filters.searchTerm) {
          const searchCondition = `license_plate.ilike.%${filters.searchTerm}%,make.ilike.%${filters.searchTerm}%,model.ilike.%${filters.searchTerm}%,vin.ilike.%${filters.searchTerm}%`;
          countQuery = countQuery.or(searchCondition);
          dataQuery = dataQuery.or(searchCondition);
        }
        
        // Apply sorting only to data query
        if (filters.sortBy) {
          const direction = filters.sortDirection || 'asc';
          dataQuery = dataQuery.order(filters.sortBy, { ascending: direction === 'asc' });
        } else {
          // Default sorting by created_at
          dataQuery = dataQuery.order('created_at', { ascending: false });
        }
        
        // Apply pagination only to data query
        if (filters.limit !== undefined) {
          dataQuery = dataQuery.limit(filters.limit);
        }
        if (filters.offset !== undefined) {
          dataQuery = dataQuery.range(
            filters.offset, 
            filters.offset + (filters.limit || 20) - 1
          );
        }
      } else {
        // Default sorting
        dataQuery = dataQuery.order('created_at', { ascending: false });
      }
      
      console.log("Executing Supabase count query");
      const countResponse = await countQuery;
      
      console.log("Executing Supabase data query");
      const dataResponse = await dataQuery;
      
      if (countResponse.error) {
        console.error("Supabase count query error:", countResponse.error);
        throw new Error(`Failed to count vehicles: ${countResponse.error.message}`);
      }
      
      if (dataResponse.error) {
        console.error("Supabase data query error:", dataResponse.error);
        throw new Error(`Failed to fetch vehicles: ${dataResponse.error.message}`);
      }
      
      const totalCount = countResponse.count || 0;
      console.log(`Retrieved ${dataResponse.data?.length || 0} vehicles out of ${totalCount} total`);
      
      return {
        data: dataResponse.data || [],
        count: totalCount
      };
    });
  }

  /**
   * Retrieves available vehicles ready for assignment
   * Filters vehicles with 'available' status for rental assignments
   * @returns Promise with list of available vehicles
   */
  async findAvailableVehicles(): Promise<ServiceResult<Vehicle[]>> {
    return handleServiceOperation(async () => {
      console.log("Finding available vehicles");
      const response = await this.repository.findByStatus(asVehicleStatus('available'));
      
      if (response.error) {
        console.error("Error finding available vehicles:", response.error);
        throw new Error(`Failed to fetch available vehicles: ${response.error.message}`);
      }
      
      // Always return an array, even if data is null
      return response.data || [];
    });
  }

  /**
   * Retrieves detailed vehicle information including maintenance history
   * @param id - Vehicle identifier
   * @returns Promise with vehicle details and associated maintenance records
   */
  async getVehicleDetails(id: string): Promise<ServiceResult<Vehicle & { maintenance: any[], vehicleType?: any }>> {
    return handleServiceOperation(async () => {
      if (!id) {
        throw new Error("Vehicle ID is required for getVehicleDetails");
      }
      
      console.log(`VehicleService.getVehicleDetails: Fetching details for vehicle ID ${id}`);
      const response = await this.repository.findWithDetails(id);
      
      if (response.error) {
        console.error(`VehicleService.getVehicleDetails: Error fetching details:`, response.error);
        throw new Error(`Failed to fetch vehicle details for ID ${id}: ${response.error.message}`);
      }
      
      if (!response.data) {
        console.error(`VehicleService.getVehicleDetails: No data returned for vehicle ID ${id}`);
        throw new Error(`No vehicle found with ID ${id}`);
      }
      
      console.log(`VehicleService.getVehicleDetails: Successfully fetched vehicle data:`, 
                 JSON.stringify({
                   id: response.data.id,
                   make: response.data.make,
                   model: response.data.model,
                   hasVehicleTypes: !!response.data.vehicle_types,
                   maintenanceCount: Array.isArray(response.data.maintenance) ? response.data.maintenance.length : 'n/a'
                 }));
      
      // Ensure maintenance is always an array
      if (!response.data.maintenance) {
        response.data.maintenance = [];
      }
      
      // Map vehicle_types to vehicleType for compatibility
      if (response.data.vehicle_types) {
        const vehicleData = response.data as any;
        vehicleData.vehicleType = {
          id: response.data.vehicle_types.id,
          name: response.data.vehicle_types.name,
          daily_rate: response.data.vehicle_types.daily_rate,
          size: response.data.vehicle_types.size
        };
        
        // If the vehicle doesn't have a daily rate set directly, use the one from the vehicle type
        if (!vehicleData.dailyRate && response.data.vehicle_types.daily_rate) {
          vehicleData.dailyRate = response.data.vehicle_types.daily_rate;
        }
        
        console.log(`VehicleService.getVehicleDetails: Mapped vehicle_types to vehicleType:`, 
                   JSON.stringify(vehicleData.vehicleType));
      } else {
        console.warn(`VehicleService.getVehicleDetails: No vehicle_types data found for vehicle ${id}`);
        // Add an empty vehicleType object to prevent null reference errors
        (response.data as any).vehicleType = {
          name: "Standard",
          daily_rate: response.data.rent_amount || 0
        };
      }
      
      return response.data;
    });
  }

  /**
   * Updates vehicle operational status
   * @param id - Vehicle identifier
   * @param status - New vehicle status
   * @returns Promise with updated vehicle record
   */
  async updateStatus(id: string, status: string): Promise<ServiceResult<Vehicle>> {
    return handleServiceOperation(async () => {
      if (!id) {
        throw new Error("Vehicle ID is required for updateStatus");
      }
      
      if (!status) {
        throw new Error("Status value is required for updateStatus");
      }
      
      console.log(`VehicleService.updateStatus: Updating vehicle ${id} status to ${status}`);
      const dbStatus = asVehicleStatus(status);
      console.log(`VehicleService.updateStatus: Mapped status to DB format: ${dbStatus}`);
      
      const response = await this.repository.updateStatus(id, dbStatus);
      
      if (response.error) {
        console.error(`VehicleService.updateStatus: Error updating status:`, response.error);
        throw new Error(`Failed to update vehicle status to ${status} for vehicle ID ${id}: ${response.error.message}`);
      }
      
      if (!response.data) {
        console.error(`VehicleService.updateStatus: No data returned after status update for vehicle ID ${id}`);
        throw new Error(`Vehicle with ID ${id} not found`);
      }
      
      console.log(`VehicleService.updateStatus: Successfully updated status for vehicle ${id}`);
      return response.data;
    });
  }

  /**
   * Gets vehicle types and categories
   * @returns Promise with list of vehicle types
   */
  async getVehicleTypes(): Promise<ServiceResult<any[]>> {
    return handleServiceOperation(async () => {
      const { data, error } = await supabase
        .from('vehicle_types')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        throw new Error(`Failed to fetch vehicle types: ${error.message}`);
      }
      
      // Always return an array, even if data is null
      return data || [];
    });
  }

  /**
   * Calculates vehicle utilization metrics for a specified period
   * @param vehicleId - Vehicle identifier
   * @param startDate - Beginning of analysis period
   * @param endDate - End of analysis period
   * @returns Promise with utilization metrics including revenue and occupancy rate
   */
  async calculateUtilizationMetrics(
    vehicleId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<ServiceResult<any>> {
    return handleServiceOperation(async () => {
      if (!vehicleId) {
        throw new Error("Vehicle ID is required for calculateUtilizationMetrics");
      }
      
      if (!startDate || !endDate) {
        throw new Error("Both startDate and endDate are required for calculateUtilizationMetrics");
      }
      
      const { data: leases, error } = await supabase
        .from('leases')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .gte('start_date', startDate.toISOString())
        .lte('end_date', endDate.toISOString());
        
      if (error) {
        throw new Error(`Failed to calculate vehicle utilization for vehicle ID ${vehicleId} from ${startDate.toISOString()} to ${endDate.toISOString()}: ${error.message}`);
      }
      
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let daysRented = 0;
      const safeLeases = leases || [];
      safeLeases.forEach(lease => {
        const leaseStart = new Date(lease.start_date || startDate);
        const leaseEnd = new Date(lease.end_date || endDate);
        
        const effectiveStart = leaseStart < startDate ? startDate : leaseStart;
        const effectiveEnd = leaseEnd > endDate ? endDate : leaseEnd;
        
        const leaseDays = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24));
        daysRented += Math.max(0, leaseDays);
      });
      
      const utilizationRate = totalDays > 0 ? (daysRented / totalDays) * 100 : 0;
      
      return {
        totalDays,
        daysRented,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        leasesCount: safeLeases.length || 0
      };
    });
  }
}

export const vehicleService = new VehicleService();
