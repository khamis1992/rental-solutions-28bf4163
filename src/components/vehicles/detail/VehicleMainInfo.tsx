
import React from 'react';
import { formatDate } from '@/lib/formatters';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Car, Wrench } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VehicleImageSection } from './VehicleImageSection';
import { VehicleDetailsSection } from './VehicleDetailsSection';
import { Vehicle } from '@/types/vehicle';

interface VehicleMainInfoProps {
  vehicle: Vehicle;
  vehicleDetails: {
    label: string;
    value: string | number | React.ReactNode;
  }[];
}

export const VehicleMainInfo: React.FC<VehicleMainInfoProps> = ({ 
  vehicle, 
  vehicleDetails 
}) => {
  const navigate = useNavigate();
  
  const isAvailable = vehicle.status === 'available';
  const isInMaintenance = vehicle.status === 'maintenance';

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Vehicle Details</CardTitle>
        <CardDescription>
          Complete information about this vehicle
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <VehicleImageSection 
          imageUrl={vehicle.image_url} 
          make={vehicle.make} 
          model={vehicle.model} 
        />
        
        <VehicleDetailsSection 
          details={vehicleDetails}
          notes={vehicle.notes}
        />
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
          <p className="text-sm">{formatDate(vehicle.updated_at || vehicle.created_at)}</p>
        </div>
        <div className="space-x-2">
          {isAvailable && (
            <Button onClick={() => navigate(`/agreements/new?vehicle_id=${vehicle.id}`)}>
              <FileText className="mr-2 h-4 w-4" />
              Create Agreement
            </Button>
          )}
          {isInMaintenance && (
            <Button onClick={() => console.log('Mark as available')}>
              <Car className="mr-2 h-4 w-4" />
              Mark as Available
            </Button>
          )}
          {!isInMaintenance && (
            <Button variant="outline" onClick={() => console.log('Mark for maintenance')}>
              <Wrench className="mr-2 h-4 w-4" />
              Mark for Maintenance
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
