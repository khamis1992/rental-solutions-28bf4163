
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Vehicle } from '@/types/vehicle';

interface VehicleSectionProps {
  vehicle: Vehicle | null;
}

export function VehicleSection({ vehicle }: VehicleSectionProps) {
  if (!vehicle) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No vehicle assigned</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Make & Model</label>
            <p className="font-medium">{vehicle.make} {vehicle.model}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Year</label>
            <p className="font-medium">{vehicle.year}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">License Plate</label>
            <p className="font-medium">{vehicle.license_plate}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Color</label>
            <p className="font-medium">{vehicle.color}</p>
          </div>
        </div>
        
        {vehicle.status && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <div className="mt-1">
              <Badge variant={vehicle.status === 'available' ? 'default' : 'secondary'}>
                {vehicle.status}
              </Badge>
            </div>
          </div>
        )}

        {vehicle.vin && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">VIN</label>
            <p className="font-medium font-mono text-sm">{vehicle.vin}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
