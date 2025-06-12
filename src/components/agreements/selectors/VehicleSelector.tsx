
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useVehicleService } from '@/hooks/services/useVehicleService';

interface VehicleSelectorProps {
  onSelect: (vehicleId: string) => void;
  selectedVehicleId?: string;
}

export function VehicleSelector({ onSelect, selectedVehicleId }: VehicleSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { vehicles, isLoadingVehicles } = useVehicleService({
    filters: { statuses: ['available'] }
  });

  const filteredVehicles = vehicles?.filter(vehicle => 
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
          {isLoadingVehicles ? (
            <SelectItem value="" disabled>Loading vehicles...</SelectItem>
          ) : (
            filteredVehicles.map((vehicle) => (
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
