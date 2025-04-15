import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useVehicles } from '@/hooks/use-vehicles';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, ArrowLeft, Car, Key, CalendarDays, User, Gauge, Cog, AlertTriangle, CheckCircle, Ban, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { VehicleStatus } from '@/types/vehicle';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { MaintenanceSchedulingWizard } from '@/components/maintenance/MaintenanceSchedulingWizard';
import { castDbId } from '@/utils/db-id-helper';

interface VehicleDetailProps {
  vehicle?: any;
}

const statusConfig = {
  available: {
    label: 'Available',
    variant: 'default',
    icon: CheckCircle,
  },
  rented: {
    label: 'Rented',
    variant: 'primary',
    icon: Car,
  },
  maintenance: {
    label: 'Maintenance',
    variant: 'secondary',
    icon: Cog,
  },
  police_station: {
    label: 'At Police Station',
    variant: 'secondary',
    icon: AlertTriangle,
  },
  accident: {
    label: 'In Accident',
    variant: 'destructive',
    icon: AlertTriangle,
  },
  stolen: {
    label: 'Stolen',
    variant: 'destructive',
    icon: Ban,
  },
  reserved: {
    label: 'Reserved',
    variant: 'secondary',
    icon: CalendarDays,
  },
};

const VehicleDetail: React.FC<VehicleDetailProps> = ({ vehicle }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useDelete } = useVehicles();
  const { mutate: deleteVehicle, isPending: isDeleting } = useDelete();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  
  const [currentVehicle, setCurrentVehicle] = React.useState<any>(vehicle);
  
  React.useEffect(() => {
    if (!vehicle && id) {
      const fetchVehicle = async () => {
        try {
          const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('id', id as any)
            .single();
            
          if (error) {
            console.error('Error fetching vehicle:', error);
            return;
          }
          
          setCurrentVehicle(data);
        } catch (err) {
          console.error('Error fetching vehicle:', err);
        }
      };
      fetchVehicle();
    }
  }, [id, vehicle]);

  if (!currentVehicle) {
    return <div>Vehicle not found.</div>;
  }

  const handleDelete = async () => {
    try {
      if (!id) return;
      await deleteVehicle(id);
      toast.success('Vehicle deleted successfully');
      navigate('/vehicles');
    } catch (err: any) {
      toast.error(`Failed to delete vehicle: ${err.message}`);
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      if (currentVehicle.id) {
        const { data, error } = await supabase
          .from('vehicles')
          .update({ deleted_at: null } as any)
          .eq('id', currentVehicle.id as any)
          .select();
          
        if (error) {
          throw new Error(error.message);
        }
        
        toast.success('Vehicle restored successfully');
        navigate('/vehicles');
      } else {
        toast.error('Vehicle ID is missing, cannot restore.');
      }
    } catch (err: any) {
      toast.error(`Failed to restore vehicle: ${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const renderVehicleDetails = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-base font-semibold">Make</h3>
          <p>{currentVehicle.make || 'N/A'}</p>
        </div>
        <div>
          <h3 className="text-base font-semibold">Model</h3>
          <p>{currentVehicle.model || 'N/A'}</p>
        </div>
        <div>
          <h3 className="text-base font-semibold">Year</h3>
          <p>{currentVehicle.year || 'N/A'}</p>
        </div>
        <div>
          <h3 className="text-base font-semibold">License Plate</h3>
          <p>{currentVehicle.license_plate || 'N/A'}</p>
        </div>
        <div>
          <h3 className="text-base font-semibold">VIN</h3>
          <p>{currentVehicle.vin || 'N/A'}</p>
        </div>
        <div>
          <h3 className="text-base font-semibold">Color</h3>
          <p>{currentVehicle.color || 'N/A'}</p>
        </div>
        <div>
          <h3 className="text-base font-semibold">Mileage</h3>
          <p>{currentVehicle.mileage ? `${currentVehicle.mileage} miles` : 'N/A'}</p>
        </div>
        <div>
          <h3 className="text-base font-semibold">Status</h3>
          {currentVehicle.status && statusConfig[currentVehicle.status as VehicleStatus] ? (
            <Badge variant={statusConfig[currentVehicle.status as VehicleStatus].variant as any}>
              {React.createElement(statusConfig[currentVehicle.status as VehicleStatus].icon, { className: "mr-2 h-4 w-4" })}
              {statusConfig[currentVehicle.status as VehicleStatus].label}
            </Badge>
          ) : (
            <Badge variant="secondary">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Unknown
            </Badge>
          )}
        </div>
        <div>
          <h3 className="text-base font-semibold">Rental Rate</h3>
          <p>{currentVehicle.rental_rate ? `$${currentVehicle.rental_rate}` : 'N/A'}</p>
        </div>
        <div>
          <h3 className="text-base font-semibold">Location</h3>
          <p>{currentVehicle.location || 'N/A'}</p>
        </div>
        <div>
          <h3 className="text-base font-semibold">Acquisition Date</h3>
          <p>{currentVehicle.acquisition_date ? format(new Date(currentVehicle.acquisition_date), 'MMM d, yyyy') : 'N/A'}</p>
        </div>
        <div>
          <h3 className="text-base font-semibold">Last Service Date</h3>
          <p>{currentVehicle.last_service_date ? format(new Date(currentVehicle.last_service_date), 'MMM d, yyyy') : 'N/A'}</p>
        </div>
        <div>
          <h3 className="text-base font-semibold">Notes</h3>
          <p>{currentVehicle.notes || 'N/A'}</p>
        </div>
      
        <div>
          <h3 className="text-base font-semibold">Type</h3>
          <p>{currentVehicle.vehicle_type_id || 'Not specified'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => navigate('/vehicles')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vehicles
          </Button>
          <h1 className="text-2xl font-bold ml-4">Vehicle Details</h1>
        </div>
        <div>
          <Button variant="outline" asChild>
            <Link to={`/vehicles/edit/${currentVehicle.id}`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Vehicle
            </Link>
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Vehicle Information</CardTitle>
        </CardHeader>
        <CardContent>
          {renderVehicleDetails()}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <MaintenanceSchedulingWizard />
          </CardContent>
        </Card>
      </div>

      <div className="space-x-2">
        {!currentVehicle.deleted_at ? (
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Vehicle
          </Button>
        ) : (
          <Button variant="outline" onClick={handleRestore} disabled={isRestoring}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {isRestoring ? 'Restoring...' : 'Restore Vehicle'}
          </Button>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this vehicle? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VehicleDetail;
