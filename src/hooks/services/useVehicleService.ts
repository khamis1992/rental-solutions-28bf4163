import { useState, useEffect } from 'react';
import { VehicleService, VehicleFilterParams, PaginatedResult } from '@/services/VehicleService';
import { usePagination } from '@/hooks/usePagination';

const vehicleService = new VehicleService();

export function useVehicleService(initialFilters: VehicleFilterParams = {}) {
  // Initialize vehicles as empty array to avoid undefined issues
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<VehicleFilterParams>(initialFilters);
  const [totalItems, setTotalItems] = useState(0);
  
  // Setup pagination with initial values
  const pagination = usePagination({
    totalItems, 
    initialPage: 1,
    itemsPerPage: 20
  });

  // Load vehicles based on filters and pagination
  useEffect(() => {
    const fetchVehicles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Include pagination parameters in the filter
        const paginatedFilters = {
          ...filters,
          limit: pagination.itemsPerPage,
          offset: (pagination.currentPage - 1) * pagination.itemsPerPage
        };
        
        console.log("Fetching vehicles with filters:", paginatedFilters);
        const result = await vehicleService.findVehicles(paginatedFilters);
        
        if (result && result.success) {
          console.log("Vehicles fetched successfully:", result.data);
          
          // Update total count and vehicles
          setTotalItems(result.data.count);
          setVehicles(Array.isArray(result.data.data) ? result.data.data : []);
        } else {
          console.error("Failed to fetch vehicles:", result?.error || "Unknown error");
          setError(result?.error?.message || "Failed to fetch vehicles");
          // Reset to empty array on error
          setVehicles([]);
        }
      } catch (err) {
        console.error("Error in vehicle service:", err);
        setError("An unexpected error occurred");
        // Reset to empty array on error
        setVehicles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicles();
  }, [filters, pagination.currentPage, pagination.itemsPerPage]);

  // Load vehicle types
  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        const result = await vehicleService.getVehicleTypes();
        if (result && result.success) {
          // Ensure we always have an array
          setVehicleTypes(Array.isArray(result.data) ? result.data : []);
        } else {
          console.error("Failed to fetch vehicle types:", result?.error || "Unknown error");
          setVehicleTypes([]);
        }
      } catch (err) {
        console.error("Error fetching vehicle types:", err);
        setVehicleTypes([]);
      }
    };

    fetchVehicleTypes();
  }, []);

  // Get available vehicles
  useEffect(() => {
    const fetchAvailableVehicles = async () => {
      try {
        const result = await vehicleService.findAvailableVehicles();
        if (result && result.success) {
          // Ensure we always have an array
          setAvailableVehicles(Array.isArray(result.data) ? result.data : []);
        } else {
          console.error("Failed to fetch available vehicles:", result?.error || "Unknown error");
          setAvailableVehicles([]);
        }
      } catch (err) {
        console.error("Error fetching available vehicles:", err);
        setAvailableVehicles([]);
      }
    };

    fetchAvailableVehicles();
  }, []);

  // Vehicle details retrieval function
  const getVehicleDetails = async (vehicleId: string) => {
    if (!vehicleId) {
      console.error("Cannot fetch vehicle details: No vehicle ID provided");
      return null;
    }
    
    try {
      const result = await vehicleService.getVehicleDetails(vehicleId);
      if (result && result.success) {
        return result.data;
      }
      console.error("Failed to fetch vehicle details:", result?.error || "Unknown error");
      return null;
    } catch (err) {
      console.error("Error fetching vehicle details:", err);
      return null;
    }
  };

  // Update vehicle status
  const updateStatus = async (vehicleId: string, status: string) => {
    if (!vehicleId) {
      console.error("Cannot update vehicle status: No vehicle ID provided");
      return null;
    }
    
    try {
      const result = await vehicleService.updateStatus(vehicleId, status);
      if (result && result.success) {
        // Refresh vehicles list after status update
        setFilters({ ...filters });
        return result.data;
      }
      console.error("Failed to update vehicle status:", result?.error || "Unknown error");
      return null;
    } catch (err) {
      console.error("Error updating vehicle status:", err);
      return null;
    }
  };

  // Update vehicle
  const updateVehicle = async (vehicleId: string, data: any) => {
    if (!vehicleId) {
      console.error("Cannot update vehicle: No vehicle ID provided");
      return null;
    }
    
    // This would call the appropriate service method
    // For now just refreshing the filters to trigger a reload
    setFilters({ ...filters });
    return null;
  };

  // Delete vehicle
  const deleteVehicle = async (vehicleId: string) => {
    if (!vehicleId) {
      console.error("Cannot delete vehicle: No vehicle ID provided");
      return false;
    }
    
    // This would call the appropriate service method
    // For now just refreshing the filters to trigger a reload
    setFilters({ ...filters });
    return true;
  };

  // Calculate utilization
  const calculateUtilization = async (
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ) => {
    if (!vehicleId) {
      console.error("Cannot calculate utilization: No vehicle ID provided");
      return {
        success: false,
        error: "Vehicle ID is required",
        data: null
      };
    }
    
    try {
      return await vehicleService.calculateUtilizationMetrics(
        vehicleId,
        startDate,
        endDate
      );
    } catch (err) {
      console.error("Error calculating utilization:", err);
      return {
        success: false,
        error: "Failed to calculate vehicle utilization",
        data: null
      };
    }
  };

  return {
    vehicles,
    isLoading,
    error,
    filters,
    setFilters,
    vehicleTypes,
    availableVehicles,
    pagination,
    totalItems,
    getVehicleDetails,
    updateVehicle,
    updateStatus,
    deleteVehicle,
    calculateUtilization,
  };
}
