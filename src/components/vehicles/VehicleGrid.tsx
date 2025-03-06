
import React from 'react';
import { VehicleCard } from '@/components/ui/vehicle-card';

// Sample vehicle data
const vehicles = [
  {
    id: '1',
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    licensePlate: 'ABC-123',
    status: 'available',
    imageUrl: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?q=80&w=2156&auto=format&fit=crop',
    location: 'Main Office',
    fuelLevel: 85,
    mileage: 12450,
  },
  {
    id: '2',
    make: 'Honda',
    model: 'Accord',
    year: 2021,
    licensePlate: 'DEF-456',
    status: 'rented',
    imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop',
    location: 'Downtown Branch',
    fuelLevel: 65,
    mileage: 28750,
  },
  {
    id: '3',
    make: 'Ford',
    model: 'Escape',
    year: 2023,
    licensePlate: 'GHI-789',
    status: 'available',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=2071&auto=format&fit=crop',
    location: 'Airport Location',
    fuelLevel: 92,
    mileage: 5230,
  },
  {
    id: '4',
    make: 'Chevrolet',
    model: 'Malibu',
    year: 2022,
    licensePlate: 'JKL-012',
    status: 'maintenance',
    imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop',
    location: 'Service Center',
    fuelLevel: 45,
    mileage: 18650,
  },
  {
    id: '5',
    make: 'Nissan',
    model: 'Rogue',
    year: 2021,
    licensePlate: 'MNO-345',
    status: 'available',
    imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=2070&auto=format&fit=crop',
    location: 'North Branch',
    fuelLevel: 78,
    mileage: 31420,
  },
  {
    id: '6',
    make: 'BMW',
    model: 'X3',
    year: 2023,
    licensePlate: 'PQR-678',
    status: 'rented',
    imageUrl: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?q=80&w=1856&auto=format&fit=crop',
    location: 'City Center',
    fuelLevel: 55,
    mileage: 8790,
  },
];

interface VehicleGridProps {
  onSelectVehicle?: (id: string) => void;
}

const VehicleGrid: React.FC<VehicleGridProps> = ({ onSelectVehicle }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 section-transition">
      {vehicles.map(vehicle => (
        <VehicleCard
          key={vehicle.id}
          {...vehicle}
          onSelect={onSelectVehicle}
        />
      ))}
    </div>
  );
};

export default VehicleGrid;
