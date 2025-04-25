
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, Calendar, FileText } from 'lucide-react';
import { Vehicle } from '@/types/vehicle';

interface VehicleSectionProps {
  vehicle: Vehicle;
  onViewDetails?: () => void;
}

const VehicleSection = ({ vehicle, onViewDetails }: VehicleSectionProps) => {
  return (
    <Card className="bg-gradient-to-br from-zinc-50 to-slate-50 border-0 shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
              <Car className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-xl">{vehicle.make} {vehicle.model}</CardTitle>
              <CardDescription>{vehicle.year} • {vehicle.license_plate}</CardDescription>
            </div>
          </div>
          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              View Details
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Vehicle Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-normal">
                  {vehicle.status}
                </Badge>
              </div>
              {vehicle.color && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Color:</span>
                  <span>{vehicle.color}</span>
                </div>
              )}
              {vehicle.vin && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">VIN:</span>
                  <span className="font-mono">{vehicle.vin}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Additional Details</h3>
            <div className="space-y-3">
              {vehicle.insurance_company && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Insurance: {vehicle.insurance_company}</span>
                </div>
              )}
              {vehicle.insurance_expiry && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Expires: {new Date(vehicle.insurance_expiry).toLocaleDateString()}</span>
                </div>
              )}
              {vehicle.mileage && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Mileage:</span>
                  <span>{vehicle.mileage.toLocaleString()} km</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleSection;
