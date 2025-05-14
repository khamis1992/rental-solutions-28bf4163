
import React, { useState, useEffect } from 'react';
import { useVehicleService } from '@/hooks/services/useVehicleService';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface VehicleSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const VehicleSelector: React.FC<VehicleSelectorProps> = ({ value, onChange }) => {
  const { vehicles, isLoading, error } = useVehicleService();
  const [selectedVehicle, setSelectedVehicle] = useState<string>(value || '');

  useEffect(() => {
    if (value) {
      setSelectedVehicle(value);
    }
  }, [value]);

  const handleChange = (newValue: string) => {
    setSelectedVehicle(newValue);
    onChange(newValue);
  };

  if (isLoading) {
    return (
      <div className="flex items-center">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <span>Loading vehicles...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading vehicles</div>;
  }

  return (
    <Select value={selectedVehicle} onValueChange={handleChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select vehicle" />
      </SelectTrigger>
      <SelectContent>
        {vehicles && vehicles.map(vehicle => {
          const displayName = `${vehicle.make} ${vehicle.model} (${vehicle.license_plate || 'No plate'})`;
          return (
            <SelectItem key={vehicle.id} value={vehicle.id || ''}>
              {displayName}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default VehicleSelector;
