
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface VehicleDetailsCardProps {
  vehicle: {
    make?: string;
    model?: string;
    license_plate?: string;
    year?: number;
    color?: string;
    vin?: string;
  };
}

export const VehicleDetailsCard: React.FC<VehicleDetailsCardProps> = ({ vehicle }) => {
  if (!vehicle) return null;
  
  return (
    <Card className="mt-4 bg-slate-50">
      <CardContent className="pt-4">
        <h3 className="font-medium mb-2">Selected Vehicle Information</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex">
            <span className="font-semibold w-24">Make:</span>
            <span>{vehicle.make}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-24">Model:</span>
            <span>{vehicle.model}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-24">Plate:</span>
            <span>{vehicle.license_plate}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-24">Year:</span>
            <span>{vehicle.year}</span>
          </div>
          {vehicle.color && (
            <div className="flex">
              <span className="font-semibold w-24">Color:</span>
              <span>{vehicle.color}</span>
            </div>
          )}
          {vehicle.vin && (
            <div className="flex">
              <span className="font-semibold w-24">VIN:</span>
              <span>{vehicle.vin}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
