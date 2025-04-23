import { memo, useMemo, useCallback } from 'react';
import React from 'react';

interface Vehicle {
  id: string;
  availability_status: string;
  // ...other properties
}

interface VehicleListProps {
  vehicles: Vehicle[];
  onVehicleSelect: (vehicle: Vehicle) => void;
  isLoading: boolean;
}

// Memoize individual vehicle items to prevent unnecessary re-renders
const VehicleItem = memo(({ vehicle, onSelect }: { vehicle: Vehicle, onSelect: (vehicle: Vehicle) => void }) => {
  const handleSelect = useCallback(() => {
    onSelect(vehicle);
  }, [vehicle.id, onSelect]);
  
  return (
    <div className="vehicle-item" onClick={handleSelect}>
      {/* ...existing code... */}
    </div>
  );
});

export function VehicleList({ vehicles, onVehicleSelect, isLoading }: VehicleListProps) {
  // Memoize derived data
  const sortedVehicles = useMemo(() => {
    return [...vehicles].sort((a, b) => 
      a.availability_status.localeCompare(b.availability_status));
  }, [vehicles]);

  // Use virtualization for large lists to improve rendering performance
  return (
    <div className="vehicle-list-container">
      {isLoading ? (
        <div className="loading-spinner">Loading vehicles...</div>
      ) : (
        <div className="vehicle-list">
          {sortedVehicles.map(vehicle => (
            <VehicleItem 
              key={vehicle.id} 
              vehicle={vehicle} 
              onSelect={onVehicleSelect} 
            />
          ))}
        </div>
      )}
    </div>
  );
}