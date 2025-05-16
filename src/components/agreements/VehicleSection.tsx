
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VehicleStatusBadge } from './VehicleStatusBadge';
import { Spinner } from '@/components/ui/spinner';
import { VehicleAssignmentDialog } from './VehicleAssignmentDialog';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  license_plate: string;
  status: string;
  mileage?: number;
}

interface VehicleSectionProps {
  vehicle: string;
  leaseId: string;
}

export const VehicleSection: React.FC<VehicleSectionProps> = ({ vehicle: vehicleId, leaseId }) => {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      setVehicle(data as Vehicle);
    } catch (err: any) {
      console.error('Error fetching vehicle:', err);
      setError(err.message || 'Failed to load vehicle data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vehicleId) {
      fetchVehicle();
    }
  }, [vehicleId]);

  const handleVehicleAssigned = () => {
    fetchVehicle();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Information</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (error || !vehicle) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            {error || 'No vehicle information available'}
          </p>
          <Button 
            onClick={() => setIsAssignDialogOpen(true)} 
            className="mt-4" 
            variant="outline"
          >
            Assign Vehicle
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Vehicle Information</CardTitle>
        <div className="flex gap-2">
          <VehicleStatusBadge status={vehicle.status} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAssignDialogOpen(true)}
          >
            Change Vehicle
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Make / Model</p>
            <p>{vehicle.make} {vehicle.model}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Year</p>
            <p>{vehicle.year}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Color</p>
            <p>{vehicle.color || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium">License Plate</p>
            <p>{vehicle.license_plate}</p>
          </div>
          {vehicle.mileage !== undefined && (
            <div>
              <p className="text-sm font-medium">Mileage</p>
              <p>{vehicle.mileage.toLocaleString()} km</p>
            </div>
          )}
        </div>
      </CardContent>
      
      <VehicleAssignmentDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        leaseId={leaseId}
        currentVehicleId={vehicleId}
        onAssignmentComplete={handleVehicleAssigned}
      />
    </Card>
  );
};
