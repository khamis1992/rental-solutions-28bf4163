
import React from 'react';
import { useVehicleService } from '@/hooks/services/useVehicleService';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VehicleSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const VehicleSelector: React.FC<VehicleSelectorProps> = ({ value, onChange }) => {
  const vehicleService = useVehicleService();
  
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      try {
        return await vehicleService.getAvailableVehicles();
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        return [];
      }
    }
  });

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a vehicle" />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <SelectItem value="loading" disabled>Loading...</SelectItem>
        ) : vehicles && vehicles.length > 0 ? (
          vehicles.map((vehicle: any) => (
            <SelectItem key={vehicle.id} value={vehicle.id}>
              {vehicle.make} {vehicle.model} - {vehicle.license_plate}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="none" disabled>No vehicles available</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

export default VehicleSelector;
