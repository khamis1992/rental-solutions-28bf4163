
import React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { Vehicle } from '@/types/vehicle';
import { VehicleMainInfo } from './detail/VehicleMainInfo';
import { VehicleStatusCard } from './detail/VehicleStatusCard';
import { VehicleQuickActions } from './detail/VehicleQuickActions';
import { VehicleTabContent } from './detail/VehicleTabContent';

interface VehicleDetailProps {
  vehicle: Vehicle;
}

const VehicleDetail: React.FC<VehicleDetailProps> = ({ vehicle }) => {
  if (!vehicle) {
    return <div>No vehicle data available</div>;
  }

  // Log the vehicle object to see what we're working with
  console.log("VehicleDetail component received vehicle:", JSON.stringify({
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    status: vehicle.status,
    hasVehicleType: !!vehicle.vehicleType,
    vehicleTypeName: vehicle.vehicleType?.name,
    dailyRate: vehicle.dailyRate || vehicle.rent_amount
  }));

  // Safe access to nested properties with fallbacks
  const vehicleTypeName = vehicle.vehicleType?.name || 'Standard';
  const dailyRate = vehicle.dailyRate || vehicle.rent_amount || 0;

  // Format vehicle details for display with defensive coding
  const vehicleDetails = [
    { label: "Make", value: vehicle.make },
    { label: "Model", value: vehicle.model },
    { label: "Year", value: vehicle.year },
    { label: "Color", value: vehicle.color || 'Not specified' },
    { label: "License Plate", value: vehicle.license_plate || 'Not specified' },
    { label: "VIN", value: vehicle.vin || 'Not specified' },
    { label: "Mileage", value: vehicle.mileage ? `${vehicle.mileage} km` : "Not recorded" },
    { label: "Daily Rate", value: dailyRate ? formatCurrency(dailyRate) : "Not set" },
    { label: "Type", value: vehicleTypeName },
    { label: "Description", value: vehicle.description || "No description available" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <VehicleMainInfo vehicle={vehicle} vehicleDetails={vehicleDetails} />

        <div className="space-y-6">
          <VehicleStatusCard vehicle={vehicle} />
          <VehicleQuickActions vehicle={vehicle} />
        </div>
      </div>

      <VehicleTabContent vehicleId={vehicle.id} />
    </div>
  );
};

export default VehicleDetail;
