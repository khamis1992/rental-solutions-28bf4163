
import React from 'react';
import { Card } from '@/components/ui/card';
import { typeGuards } from '@/lib/database';

interface VehicleGridProps {
  vehicles?: any[];
  isLoading?: boolean;
  onVehicleClick?: (id: string) => void;
  // Support legacy prop name for backward compatibility
  onSelectVehicle?: (id: string) => void;
  filter?: any; // Keep for backward compatibility
}

// Define a type for the expected vehicle structure
interface Vehicle {
  id: string;
  make: string;
  model: string;
  license_plate: string;
  status: string;
  year: number | string;
  // Add other fields as needed
}

const VehicleGrid: React.FC<VehicleGridProps> = ({
  vehicles = [],
  isLoading = false,
  onVehicleClick,
  onSelectVehicle, // Support legacy prop name
  filter // Keep for backward compatibility
}) => {
  const handleVehicleClick = (id: string) => {
    if (onVehicleClick) {
      onVehicleClick(id);
    } else if (onSelectVehicle) {
      // Support legacy prop name
      onSelectVehicle(id);
    }
  };

  // Safely check if vehicles is an array and has length
  const hasVehicles = typeGuards.isArray(vehicles) && vehicles.length > 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-4 h-32 animate-pulse bg-gray-50">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {!hasVehicles ? (
        <Card className="col-span-full p-6 text-center text-muted-foreground">
          No vehicles found.
        </Card>
      ) : (
        // Safely map over vehicles array with type assertion
        vehicles.map((vehicle: any) => (
          <Card 
            key={vehicle?.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => vehicle?.id && handleVehicleClick(vehicle.id)}
          >
            <div className="p-4">
              <h3 className="text-lg font-medium">{vehicle?.make || ''} {vehicle?.model || ''}</h3>
              <p className="text-sm text-muted-foreground">{vehicle?.license_plate || ''}</p>
              <div className="mt-2 flex justify-between items-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {vehicle?.status || 'unknown'}
                </span>
                <span className="text-sm text-gray-500">{vehicle?.year || ''}</span>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default VehicleGrid;
