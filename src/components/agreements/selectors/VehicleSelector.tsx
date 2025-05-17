
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';

interface VehicleSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  selectedVehicle?: any;
  onVehicleSelect?: (vehicle: any) => void;
}

const VehicleSelector: React.FC<VehicleSelectorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Select a vehicle",
  selectedVehicle,
  onVehicleSelect
}) => {
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('status', 'available')
          .order('make');
        
        if (error) {
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        return [];
      }
    }
  });
  
  // Handle the vehicle selection
  const handleSelectionChange = (vehicleId: string) => {
    onChange(vehicleId);
    
    if (onVehicleSelect) {
      const selectedVehicle = vehicles?.find(v => v.id === vehicleId);
      if (selectedVehicle) {
        onVehicleSelect(selectedVehicle);
      }
    }
  };

  return (
    <Select 
      value={value} 
      onValueChange={handleSelectionChange}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
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
