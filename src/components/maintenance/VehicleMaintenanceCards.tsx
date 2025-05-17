import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { AlertTriangle, Car, CheckCircle, Clock, Settings, Wrench } from 'lucide-react';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  license_plate: string;
  status?: string;
  image_url?: string;
  maintenance?: any[];
}

interface VehicleMaintenanceCardsProps {
  vehicles: Vehicle[];
  isLoading?: boolean;
}

const VehicleMaintenanceCards = ({ vehicles, isLoading = false }: VehicleMaintenanceCardsProps) => {
  const navigate = useNavigate();

  const handleVehicleClick = (id: string) => {
    navigate(`/vehicles/${id}`);
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'maintenance':
        return <Wrench className="h-5 w-5 text-orange-500" />;
      case 'accident':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Settings className="h-5 w-5 text-blue-500" />;
    }
  };

  const getMaintenanceStatusBadge = (record: any) => {
    if (!record) return null;
    switch(record.status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Scheduled</Badge>;
      case 'in_progress':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Completed</Badge>;
      default:
        return <Badge>{record.status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-24 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No vehicles currently in maintenance.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {vehicles.map((vehicle) => {
        const maintenanceRecord = vehicle.maintenance && vehicle.maintenance[0];
        
        return (
          <Card 
            key={vehicle.id} 
            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleVehicleClick(vehicle.id)}
          >
            <div className="relative h-40">
              {vehicle.image_url ? (
                <img 
                  src={vehicle.image_url} 
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Car className="h-12 w-12 text-gray-400" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge className="bg-red-500 text-white">In Maintenance</Badge>
              </div>
            </div>
            
            <CardHeader className="pb-2">
              <CardTitle>
                {vehicle.make} {vehicle.model} {vehicle.year}
              </CardTitle>
              <CardDescription>
                License: {vehicle.license_plate}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {getStatusIcon(vehicle.status || 'maintenance')}
                  <span className="ml-2 text-sm font-medium">{vehicle.status === 'accident' ? 'Accident Repair' : 'Maintenance'}</span>
                </div>
                
                {maintenanceRecord && (
                  <div>
                    {getMaintenanceStatusBadge(maintenanceRecord)}
                  </div>
                )}
              </div>
              
              {maintenanceRecord && (
                <div className="mt-4 space-y-1 text-sm">
                  <p><span className="font-medium">Service:</span> {maintenanceRecord.service_type}</p>
                  <p className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span>
                      {maintenanceRecord.scheduled_date ? 
                        format(new Date(maintenanceRecord.scheduled_date), 'MMM d, yyyy') : 
                        'Not scheduled'
                      }
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default VehicleMaintenanceCards;
