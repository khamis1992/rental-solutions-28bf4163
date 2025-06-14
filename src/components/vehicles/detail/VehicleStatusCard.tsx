
import React from 'react';
import { Car, FileText, Wrench, Plus } from 'lucide-react';
import { VehicleStatusBadge } from '@/components/vehicles/VehicleStatusBadge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Vehicle } from '@/types/vehicle';

interface VehicleStatusCardProps {
  vehicle: Vehicle;
}

export const VehicleStatusCard: React.FC<VehicleStatusCardProps> = ({ vehicle }) => {
  const navigate = useNavigate();
  
  const isAvailable = vehicle.status === 'available';
  const isInMaintenance = vehicle.status === 'maintenance';
  const isRented = vehicle.status === 'rented';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Status</CardTitle>
        <CardDescription>
          Vehicle availability and rental status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <VehicleStatusBadge status={vehicle.status} />
          </div>
          
          {isRented && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Currently Rented</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => navigate(`/agreements?vehicle_id=${vehicle.id}`)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Agreements
                </Button>
              </div>
            </>
          )}
          
          {!isRented && isAvailable && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm">This vehicle is available for rent.</p>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate(`/agreements/new?vehicle_id=${vehicle.id}`)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Agreement
                </Button>
              </div>
            </>
          )}
          
          {isInMaintenance && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm">This vehicle is currently under maintenance.</p>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate(`/maintenance/add?vehicle_id=${vehicle.id}`)}
                >
                  <Wrench className="mr-2 h-4 w-4" />
                  Add Maintenance Record
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
