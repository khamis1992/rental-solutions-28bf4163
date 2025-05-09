
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Vehicle } from '@/types/vehicle';
import { VehicleStatusBadge } from '@/components/vehicles/VehicleStatusBadge';
import { Car, FileText, Wrench, Plus, Edit } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface VehicleDetailProps {
  vehicle: Vehicle;
}

const VehicleDetail: React.FC<VehicleDetailProps> = ({ vehicle }) => {
  const navigate = useNavigate();
  
  if (!vehicle) {
    return <div>No vehicle data available</div>;
  }

  // Log the vehicle object to see what we're working with
  console.log("VehicleDetail component received vehicle:", JSON.stringify({
    id: vehicle.id,
    make: vehicle.make,
    model: vehicle.model,
    status: vehicle.status,
    hasVehicleType: !!vehicle.vehicleType,
    vehicleTypeName: vehicle.vehicleType?.name,
    dailyRate: vehicle.dailyRate || vehicle.rent_amount
  }));

  const isAvailable = vehicle.status === 'available';
  const isInMaintenance = vehicle.status === 'maintenance';
  const isRented = vehicle.status === 'rented';

  // Safe access to nested properties with fallbacks
  const vehicleTypeName = vehicle.vehicleType?.name || 'Standard';
  const dailyRate = vehicle.dailyRate || vehicle.rent_amount || 0;

  // Format vehicle details for display with defensive coding
  const vehicleDetails = [
    { label: "Make", value: vehicle.make },
    { label: "Model", value: vehicle.model },
    { label: "Year", value: vehicle.year },
    { label: "Color", value: vehicle.color || 'Not specified' },
    { label: "License Plate", value: vehicle.license_plate || 'Not specified' },
    { label: "VIN", value: vehicle.vin || 'Not specified' },
    { label: "Mileage", value: vehicle.mileage ? `${vehicle.mileage} km` : "Not recorded" },
    { label: "Daily Rate", value: dailyRate ? formatCurrency(dailyRate) : "Not set" },
    { label: "Type", value: vehicleTypeName },
    { label: "Description", value: vehicle.description || "No description available" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Vehicle Details</CardTitle>
            <CardDescription>
              Complete information about this vehicle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="h-[300px] w-full bg-muted rounded-md flex items-center justify-center">
              {vehicle.image_url ? (
                <img 
                  src={vehicle.image_url}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="object-contain w-full h-full rounded-md"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Car className="h-16 w-16 mb-2" />
                  <p>No image available</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicleDetails.map((detail, index) => (
                <div key={index} className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{detail.label}</p>
                  <p className="text-base">{detail.value}</p>
                </div>
              ))}
            </div>

            {vehicle.notes && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                <p className="text-base whitespace-pre-line">{vehicle.notes}</p>
              </div>
            )}
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

        <div className="space-y-6">
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

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate(`/maintenance/add?vehicle_id=${vehicle.id}`)}
              >
                <Wrench className="mr-2 h-4 w-4" />
                Add Maintenance Record
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate(`/agreements/new?vehicle_id=${vehicle.id}`)}
                disabled={!isAvailable}
              >
                <FileText className="mr-2 h-4 w-4" />
                Create New Agreement
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate(`/vehicles/edit/${vehicle.id}`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Vehicle Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="agreements" className="w-full">
        <TabsList>
          <TabsTrigger value="agreements" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Agreements
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center">
            <Wrench className="mr-2 h-4 w-4" />
            Maintenance History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="agreements" className="space-y-4">
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground">
              Agreement history will be displayed here
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground">
              Maintenance history will be displayed here
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VehicleDetail;
