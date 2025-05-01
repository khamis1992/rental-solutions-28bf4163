
import React from 'react';
import { VehicleInfo } from '@/types/vehicle-assignment.types';

interface VehicleDetailsSectionProps {
  vehicleInfo: VehicleInfo;
  isDetailsOpen: boolean;
}

export const VehicleDetailsSection: React.FC<VehicleDetailsSectionProps> = ({ 
  vehicleInfo, 
  isDetailsOpen 
}) => {
  if (!isDetailsOpen || !vehicleInfo) return null;
  
  return (
    <div className="border rounded-md p-3 bg-white">
      <h4 className="font-medium text-sm mb-2">Vehicle Information</h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div>
          <span className="font-medium">Make:</span> {vehicleInfo.make}
        </div>
        <div>
          <span className="font-medium">Model:</span> {vehicleInfo.model}
        </div>
        <div>
          <span className="font-medium">Year:</span> {vehicleInfo.year || 'N/A'}
        </div>
        <div>
          <span className="font-medium">Color:</span> {vehicleInfo.color || 'N/A'}
        </div>
        <div>
          <span className="font-medium">License Plate:</span> {vehicleInfo.license_plate}
        </div>
      </div>
    </div>
  );
};
