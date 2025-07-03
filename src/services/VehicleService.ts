import { supabase } from '@/lib/supabase';
import { BaseService } from './base/BaseService';
import { 
  ExtendedVehicle, 
  VehicleStatus, 
  VehicleInsert, 
  VehicleUpdate,
  VehicleFilterParams,
  VehicleFilters
} from '@/types/vehicle';
import { 
  createServiceError, 
  createNotFoundError,
  ErrorContext,
  AppError,
  ErrorDetails
} from '@/types/error.types';
import { handleApiError } from '@/utils/unified-error-handler';
import { VehicleRepository } from '@/lib/database/vehicle-repository';
import { createSuccessResult, createErrorResult, Result } from '@/types/response.types';
import { 
  enhancedSearchVehicles, 
  searchVehiclesByLicensePlate,
  searchVehicles as apiSearchVehicles
} from '@/lib/vehicles/vehicle-api';
import { enhancedVehicleSearch, isLicensePlatePattern } from '@/utils/searchUtils';

export class VehicleService extends BaseService {
  private repository: VehicleRepository;

  constructor() {
    super(supabase);
    this.repository = new VehicleRepository();
  }

  async getAllVehicles(filters?: VehicleFilterParams): Promise<Result<ExtendedVehicle[]>> {
    try {
      const dbFilters: VehicleFilters = {
        status: filters?.statuses?.[0],
        make: filters?.make,
        model: filters?.model,
        year: filters?.year
      };

      const { data, error } = await this.repository.findAll(dbFilters);
      if (error) {
        return createErrorResult(
          createServiceError('Failed to fetch vehicles', { operation: 'getAllVehicles' })
        );
      }
      return createSuccessResult(data || []);
    } catch (error) {
      return createErrorResult(
        createServiceError('Unexpected error while fetching vehicles', { operation: 'getAllVehicles' })
      );
    }
  }

  async getVehicleById(id: string): Promise<Result<ExtendedVehicle>> {
    try {
      const { data, error } = await this.repository.findById(id);
      if (error) {
        return createErrorResult(
          createServiceError('Failed to fetch vehicle', { operation: 'getVehicleById', id })
        );
      }
      if (!data) {
        return createErrorResult(
          createServiceError('Vehicle not found', { operation: 'getVehicleById', id })
        );
      }
      return createSuccessResult(data);
    } catch (error) {
      return createErrorResult(
        createServiceError('Unexpected error while fetching vehicle', { operation: 'getVehicleById', id })
      );
    }
  }

  async createVehicle(vehicle: VehicleInsert): Promise<Result<ExtendedVehicle>> {
    try {
      const { data, error } = await this.repository.create(vehicle);
      if (error) {
        return createErrorResult(
          createServiceError('Failed to create vehicle', { operation: 'createVehicle' })
        );
      }
      if (!data) {
        return createErrorResult(
          createServiceError('Failed to create vehicle - no data returned', { operation: 'createVehicle' })
        );
      }
      return createSuccessResult(data);
    } catch (error) {
      return createErrorResult(
        createServiceError('Unexpected error while creating vehicle', { operation: 'createVehicle' })
      );
    }
  }

  async updateVehicle(id: string, vehicle: VehicleUpdate): Promise<Result<ExtendedVehicle>> {
    try {
      const { data, error } = await this.repository.update(id, vehicle);
      if (error) {
        return createErrorResult(
          createServiceError('Failed to update vehicle', { operation: 'updateVehicle', id })
        );
      }
      if (!data) {
        return createErrorResult(
          createServiceError('Vehicle not found', { operation: 'updateVehicle', id })
        );
      }
      return createSuccessResult(data);
    } catch (error) {
      return createErrorResult(
        createServiceError('Unexpected error while updating vehicle', { operation: 'updateVehicle', id })
      );
    }
  }

  async deleteVehicle(id: string): Promise<Result<void>> {
    try {
      const { error } = await this.repository.delete(id);
      if (error) {
        return createErrorResult(
          createServiceError('Failed to delete vehicle', { operation: 'deleteVehicle', id })
        );
      }
      return createSuccessResult(undefined);
    } catch (error) {
      return createErrorResult(
        createServiceError('Unexpected error while deleting vehicle', { operation: 'deleteVehicle', id })
      );
    }
  }

  async getAvailableVehicles(): Promise<Result<ExtendedVehicle[]>> {
    try {
      const { data, error } = await this.repository.findAvailable();
      if (error) {
        return createErrorResult(
          createServiceError('Failed to fetch available vehicles', { operation: 'getAvailableVehicles' })
        );
      }
      return createSuccessResult(data || []);
    } catch (error) {
      return createErrorResult(
        createServiceError('Unexpected error while fetching available vehicles', { operation: 'getAvailableVehicles' })
      );
    }
  }

  async updateVehicleStatus(id: string, status: VehicleStatus): Promise<Result<ExtendedVehicle>> {
    return this.updateVehicle(id, { status });
  }

  async getVehiclesByStatus(status: VehicleStatus): Promise<Result<ExtendedVehicle[]>> {
    try {
      const filters: VehicleFilters = { status };
      const { data, error } = await this.repository.findAll(filters);
      if (error) {
        return createErrorResult(
          createServiceError('Failed to fetch vehicles by status', { 
            operation: 'getVehiclesByStatus',
            params: { status }
          })
        );
      }
      return createSuccessResult(data || []);
    } catch (error) {
      return createErrorResult(
        createServiceError('Unexpected error while fetching vehicles by status', { 
          operation: 'getVehiclesByStatus',
          params: { status }
        })
      );
    }
  }

  async searchVehicles(searchTerm: string): Promise<Result<ExtendedVehicle[]>> {
    try {
      // Use the enhanced API search function
      const data = await apiSearchVehicles(searchTerm);
      
      if (!data) {
        return createErrorResult(
          createServiceError('Failed to search vehicles', { 
            operation: 'searchVehicles',
            params: { searchTerm }
          })
        );
      }
      
      return createSuccessResult(data);
    } catch (error) {
      return createErrorResult(
        createServiceError('Unexpected error while searching vehicles', { 
          operation: 'searchVehicles',
          params: { searchTerm }
        })
      );
    }
  }

  async enhancedSearchVehicles(
    searchTerm: string,
    options?: {
      minConfidence?: number;
      includeMatchDetails?: boolean;
      maxResults?: number;
    }
  ): Promise<Result<(ExtendedVehicle & { matchScore?: number; matchDetails?: string[] })[]>> {
    try {
      const data = await enhancedSearchVehicles(searchTerm, options);
      
      if (!data) {
        return createErrorResult(
          createServiceError('Failed to perform enhanced search', { 
            operation: 'enhancedSearchVehicles',
            params: { searchTerm, options }
          })
        );
      }
      
      return createSuccessResult(data);
    } catch (error) {
      return createErrorResult(
        createServiceError('Unexpected error while performing enhanced search', { 
          operation: 'enhancedSearchVehicles',
          params: { searchTerm, options }
        })
      );
    }
  }

  async searchVehiclesByLicensePlate(
    licensePlateQuery: string,
    options?: {
      minConfidence?: number;
      exactMatchOnly?: boolean;
    }
  ): Promise<Result<(ExtendedVehicle & { matchScore?: number; matchType?: string })[]>> {
    try {
      const data = await searchVehiclesByLicensePlate(licensePlateQuery, options);
      
      if (!data) {
        return createErrorResult(
          createServiceError('Failed to search vehicles by license plate', { 
            operation: 'searchVehiclesByLicensePlate',
            params: { licensePlateQuery, options }
          })
        );
      }
      
      return createSuccessResult(data);
    } catch (error) {
      return createErrorResult(
        createServiceError('Unexpected error while searching vehicles by license plate', { 
          operation: 'searchVehiclesByLicensePlate',
          params: { licensePlateQuery, options }
        })
      );
    }
  }

  /**
   * Smart search that automatically determines the best search strategy
   * based on the search term pattern
   */
  async smartSearch(
    searchTerm: string,
    options?: {
      minConfidence?: number;
      maxResults?: number;
    }
  ): Promise<Result<(ExtendedVehicle & { matchScore?: number; matchDetails?: string[] })[]>> {
    try {
      // Determine if this looks like a license plate search
      if (isLicensePlatePattern(searchTerm)) {
        // Use license plate specific search
        const plateResults = await this.searchVehiclesByLicensePlate(searchTerm, {
          minConfidence: options?.minConfidence || 50,
          exactMatchOnly: false
        });
        
        if (plateResults.success && plateResults.data.length > 0) {
          // Convert to enhanced search result format
          const enhancedResults = plateResults.data.map(vehicle => ({
            ...vehicle,
            matchDetails: [`License Plate (${vehicle.matchType}): ${vehicle.matchScore?.toFixed(1)}%`]
          }));
          
          return createSuccessResult(enhancedResults);
        }
      }
      
      // Fall back to enhanced general search
      return this.enhancedSearchVehicles(searchTerm, {
        minConfidence: options?.minConfidence || 30,
        includeMatchDetails: true,
        maxResults: options?.maxResults || 20
      });
    } catch (error) {
      return createErrorResult(
        createServiceError('Unexpected error while performing smart search', { 
          operation: 'smartSearch',
          params: { searchTerm, options }
        })
      );
    }
  }
}

export const vehicleService = new VehicleService();
