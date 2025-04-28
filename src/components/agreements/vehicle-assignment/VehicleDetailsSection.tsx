
import { VehicleInfo } from '@/types/vehicle-assignment.types';

interface VehicleDetailsSectionProps {
  vehicleInfo: VehicleInfo | null;
  isDetailsOpen: boolean;
}

export function VehicleDetailsSection({ vehicleInfo, isDetailsOpen }: VehicleDetailsSectionProps) {
  if (!vehicleInfo || !isDetailsOpen) return null;

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Vehicle Information</h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div><span className="font-medium">Make:</span> {vehicleInfo.make}</div>
        <div><span className="font-medium">Model:</span> {vehicleInfo.model}</div>
        <div><span className="font-medium">License Plate:</span> {vehicleInfo.license_plate}</div>
        {vehicleInfo.year && <div><span className="font-medium">Year:</span> {vehicleInfo.year}</div>}
        {vehicleInfo.color && <div><span className="font-medium">Color:</span> {vehicleInfo.color}</div>}
      </div>
    </div>
  );
}

