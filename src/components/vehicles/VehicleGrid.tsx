
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useVehicles, Vehicle } from '@/hooks/use-vehicles';
import { useNavigate } from 'react-router-dom';

const VehicleCard: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
  return (
    <Card className="bg-white shadow-md rounded-lg overflow-hidden">
      {vehicle.image_url && (
        <img src={vehicle.image_url} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-48 object-cover" />
      )}
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{vehicle.make} {vehicle.model}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600">Year: {vehicle.year}</p>
            <p className="text-gray-600">License Plate: {vehicle.license_plate}</p>
          </div>
          <Badge variant="secondary">{vehicle.status}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

const VehicleGrid = () => {
  const navigate = useNavigate();
  const { vehicles, isLoading, error } = useVehicles();

  const handleAddVehicle = () => {
    navigate('/vehicles/new');
  };

  const hasVehicles = Array.isArray(vehicles) && vehicles.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Vehicles</h2>
        <Button onClick={handleAddVehicle}>
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      {isLoading ? (
        <p>Loading vehicles...</p>
      ) : error ? (
        <p>Error: {(error as Error).message}</p>
      ) : (
        <>
          {hasVehicles ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map(vehicle => (
                <Link to={`/vehicles/${vehicle.id}`} key={vehicle.id}>
                  <VehicleCard vehicle={vehicle} />
                </Link>
              ))}
            </div>
          ) : (
            <p>No vehicles found.</p>
          )}
        </>
      )}
    </div>
  );
};

export default VehicleGrid;
