import React from 'react';
import { Card } from '@/components/ui/card';
import { typeGuards } from '@/lib/database';

interface VehicleGridProps {
  vehicles?: any[];
  isLoading?: boolean;
  onVehicleClick?: (id: string) => void;
}

const VehicleGrid: React.FC<VehicleGridProps> = ({
  vehicles = [],
  isLoading = false,
  onVehicleClick
}) => {
  const handleVehicleClick = (id: string) => {
    if (onVehicleClick) {
      onVehicleClick(id);
    }
  };

  // Safely check if vehicles is an array and has length
  const hasVehicles = typeGuards.isArray(vehicles) && vehicles.length > 0;

  if (isLoading) {
    return <div>Loading vehicles...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {!hasVehicles ? (
        <Card className="col-span-full p-6 text-center text-muted-foreground">
          No vehicles found.
        </Card>
      ) : (
        // Safely map over vehicles array
        typeGuards.isArray(vehicles) && vehicles.map(vehicle => (
          <Card 
            key={vehicle.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleVehicleClick(vehicle.id)}
          >
            {/* Vehicle card content */}
            <div className="p-4">
              <h3 className="text-lg font-medium">{vehicle.make} {vehicle.model}</h3>
              <p className="text-sm text-muted-foreground">{vehicle.license_plate}</p>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default VehicleGrid;
