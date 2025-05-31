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
import { VehicleRepository } from '@/lib/database/vehicle-repository';
import { createSuccessResult, createErrorResult, Result } from '@/types/response.types';

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
      const { data, error } = await this.repository.findAll();
      if (error) {
        return createErrorResult(
          createServiceError('Failed to search vehicles', { 
            operation: 'searchVehicles',
            params: { searchTerm }
          })
        );
      }
      const filteredData = data?.filter(vehicle => {
        const make = vehicle.make?.toLowerCase() || '';
        const model = vehicle.model?.toLowerCase() || '';
        const licensePlate = vehicle.license_plate?.toLowerCase() || '';
        const searchTermLower = searchTerm.toLowerCase();
        
        return make.includes(searchTermLower) ||
               model.includes(searchTermLower) ||
               licensePlate.includes(searchTermLower);
      }) || [];
      return createSuccessResult(filteredData);
    } catch (error) {
      return createErrorResult(
        createServiceError('Unexpected error while searching vehicles', { 
          operation: 'searchVehicles',
          params: { searchTerm }
        })
      );
    }
  }
}

export const vehicleService = new VehicleService();
