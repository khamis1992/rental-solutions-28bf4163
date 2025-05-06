
import { useState, useEffect } from 'react';
import { VehicleService, VehicleFilterParams } from '@/services/VehicleService';

const vehicleService = new VehicleService();

export function useVehicleService(initialFilters: VehicleFilterParams = {}) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<any[]>([]);
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<VehicleFilterParams>(initialFilters);

  // Load vehicles based on filters
  useEffect(() => {
    const fetchVehicles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await vehicleService.findVehicles(filters);
        if (result && result.success) {
          setVehicles(result.data || []);
        } else {
          console.error("Failed to fetch vehicles:", result?.error || "Unknown error");
          setError(result?.error?.message || "Failed to fetch vehicles");
          setVehicles([]);
        }
      } catch (err) {
        console.error("Error in vehicle service:", err);
        setError("An unexpected error occurred");
        setVehicles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicles();
  }, [filters]);

  // Load vehicle types
  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        const result = await vehicleService.getVehicleTypes();
        if (result && result.success) {
          setVehicleTypes(result.data || []);
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
          setAvailableVehicles(result.data || []);
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
    // This would call the appropriate service method
    // For now just refreshing the filters to trigger a reload
    setFilters({ ...filters });
    return null;
  };

  // Delete vehicle
  const deleteVehicle = async (vehicleId: string) => {
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
    getVehicleDetails,
    updateVehicle,
    updateStatus,
    deleteVehicle,
    calculateUtilization,
  };
}
