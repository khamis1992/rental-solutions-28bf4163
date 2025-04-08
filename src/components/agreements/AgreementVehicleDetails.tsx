
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Vehicle } from '@/types/vehicle';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Car, Truck, FileCheck, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AgreementVehicleDetailsProps {
  vehicle?: Vehicle;
  isLoading: boolean;
}

const AgreementVehicleDetails: React.FC<AgreementVehicleDetailsProps> = ({ vehicle, isLoading }) => {
  if (isLoading || !vehicle) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            {isLoading ? 'Loading vehicle details...' : 'Vehicle information not available'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          {vehicle.type === 'truck' ? (
            <Truck className="mr-2 h-5 w-5" />
          ) : (
            <Car className="mr-2 h-5 w-5" />
          )}
          Vehicle Details
        </CardTitle>
        <Button asChild variant="outline" size="sm">
          <Link to={`/vehicles/${vehicle.id}`}>
            <FileCheck className="mr-2 h-4 w-4" />
            Full Details
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground text-sm">Make & Model</Label>
            <p className="font-medium">
              {vehicle.make} {vehicle.model} ({vehicle.year})
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">License Plate</Label>
            <p className="font-medium">{vehicle.license_plate}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Color</Label>
            <p className="font-medium">{vehicle.color || 'N/A'}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">VIN</Label>
            <p className="font-medium">{vehicle.vin}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Mileage</Label>
            <p className="font-medium">{vehicle.mileage?.toLocaleString() || 'N/A'} km</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Status</Label>
            <p className="font-medium flex items-center">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                vehicle.status === 'available' ? 'bg-green-500' : 
                vehicle.status === 'maintenance' ? 'bg-yellow-500' : 'bg-blue-500'
              }`}></span>
              {vehicle.status}
            </p>
          </div>
        </div>

        {vehicle.status === 'maintenance' && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-start">
              <Wrench className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  This vehicle is currently under maintenance
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  The vehicle is not available for new agreements until maintenance is complete.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgreementVehicleDetails;
