
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface VehicleSectionProps {
  vehicle: any;
  onViewDetails?: () => void;
}

export function VehicleSection({ vehicle, onViewDetails }: VehicleSectionProps) {
  if (!vehicle) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50">
        <CardTitle className="flex items-center justify-between">
          <div>{vehicle.make} {vehicle.model}</div>
          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              View Vehicle Details
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="mt-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">License Plate</p>
            <p className="text-base">{vehicle.license_plate || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Year</p>
            <p className="text-base">{vehicle.year || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Color</p>
            <p className="text-base">{vehicle.color || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">VIN</p>
            <p className="text-base">{vehicle.vin || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Registration</p>
            <p className="text-base">{vehicle.registration_number || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p className="text-base">{vehicle.status || 'N/A'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
