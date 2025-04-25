
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Vehicle } from '@/types/vehicle';
import { cn } from '@/lib/utils';

interface VehicleSelectorProps {
  vehicles: Vehicle[];
  selectedVehicleId: string;
  onChange: (id: string) => void;
}

const VehicleSelector: React.FC<VehicleSelectorProps> = ({ 
  vehicles,
  selectedVehicleId,
  onChange
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const filteredVehicles = vehicles.filter(vehicle => 
    vehicle.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="space-y-4">
      <div className="flex">
        <Input 
          placeholder="Search by make, model, or license plate" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>
      
      {filteredVehicles.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? "No vehicles match your search" : "No vehicles available"}
        </div>
      ) : (
        <RadioGroup 
          value={selectedVehicleId} 
          onValueChange={onChange}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {filteredVehicles.map(vehicle => (
            <div key={vehicle.id} className="relative">
              <RadioGroupItem
                value={vehicle.id}
                id={`vehicle-${vehicle.id}`}
                className="sr-only peer"
              />
              <Label
                htmlFor={`vehicle-${vehicle.id}`}
                className={cn(
                  "flex flex-col h-full border rounded-md p-4 cursor-pointer",
                  "hover:bg-accent hover:text-accent-foreground",
                  "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10",
                  "transition-colors"
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                    <div className="text-sm text-muted-foreground">{vehicle.year}</div>
                  </div>
                  <div className="bg-primary/20 text-primary font-medium px-2 py-1 rounded text-xs">
                    {vehicle.license_plate}
                  </div>
                </div>

                <div className="mt-2 text-sm flex justify-between">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Status</span>
                    <span className={cn(
                      "font-medium",
                      vehicle.status === 'available' ? "text-green-600" : 
                      vehicle.status === 'maintenance' ? "text-amber-600" : 
                      "text-muted-foreground"
                    )}>
                      {vehicle.status}
                    </span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Mileage</span>
                    <span className="font-medium">{vehicle.mileage?.toLocaleString() || 'N/A'} km</span>
                  </div>
                </div>
                
                {vehicle.image_url && (
                  <div className="mt-2 h-24 w-full overflow-hidden rounded">
                    <img 
                      src={vehicle.image_url} 
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}
    </div>
  );
};

export default VehicleSelector;
