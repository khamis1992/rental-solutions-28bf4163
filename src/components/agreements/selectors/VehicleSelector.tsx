
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useVehicleService } from '@/hooks/services/useVehicleService';

interface Vehicle {
  id: string;
  make?: string;
  model?: string;
  license_plate?: string;
}

interface VehicleSelectorProps {
  onSelect: (vehicleId: string) => void;
  selectedVehicleId?: string;
}

export function VehicleSelector({ onSelect, selectedVehicleId }: VehicleSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { vehicles, isLoading } = useVehicleService({
    filters: { statuses: ['available'] }
  });

  const filteredVehicles = vehicles?.filter((vehicle: Vehicle) => 
    vehicle.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.license_plate?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search vehicles..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      
      <Select onValueChange={onSelect} value={selectedVehicleId}>
        <SelectTrigger>
          <SelectValue placeholder="Select a vehicle" />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="" disabled>Loading vehicles...</SelectItem>
          ) : (
            filteredVehicles.map((vehicle: Vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.make} {vehicle.model} - {vehicle.license_plate}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
