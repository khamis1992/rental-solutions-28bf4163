
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - replace with actual API call
    const mockVehicles: Vehicle[] = [
      { id: '1', make: 'Toyota', model: 'Camry', license_plate: 'ABC123' },
      { id: '2', make: 'Honda', model: 'Civic', license_plate: 'XYZ789' }
    ];
    
    setTimeout(() => {
      setVehicles(mockVehicles);
      setIsLoading(false);
    }, 1000);
  }, []);

  const filteredVehicles = vehicles.filter((vehicle: Vehicle) => 
    vehicle.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.license_plate?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
