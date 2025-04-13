import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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
import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/types/vehicle';

interface VehicleDetailProps {
  vehicleId?: string;
}

const VehicleDetail: React.FC<VehicleDetailProps> = ({ vehicleId }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchVehicle = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', id || vehicleId)
          .single();

        if (error) {
          console.error("Error fetching vehicle:", error);
          return;
        }

        if (data) {
          setVehicle(data as Vehicle);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicle();
  }, [id, vehicleId]);

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id || vehicleId);

      if (error) {
        console.error("Error deleting vehicle:", error);
        return;
      }

      navigate('/vehicles');
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-1/4" /></CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (!vehicle) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <AlertTriangle className="h-10 w-10 text-red-500 mb-4" />
          <CardTitle className="text-lg font-semibold">Vehicle Not Found</CardTitle>
          <CardDescription className="text-muted-foreground">
            The requested vehicle could not be found.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{vehicle.make} {vehicle.model}</CardTitle>
        <CardDescription>Vehicle Details</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {vehicle?.image_url ? (
          <img src={vehicle.image_url} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-auto object-cover rounded-lg" />
        ) : (
          <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
            No Image
          </div>
        )}
        <div className="space-y-1">
          <p className="text-sm font-medium">Make: <span className="font-medium">{vehicle.make}</span></p>
          <p className="text-sm font-medium">Model: <span className="font-medium">{vehicle.model}</span></p>
          <p className="text-sm font-medium">Year: <span className="font-medium">{vehicle.year}</span></p>
          <p className="text-sm font-medium">License Plate: <span className="font-medium">{vehicle.license_plate}</span></p>
          <p className="text-sm font-medium">VIN: <span className="font-medium">{vehicle.vin}</span></p>
          <p className="text-sm font-medium">Color: <span className="font-medium">{vehicle.color || 'Not specified'}</span></p>
          <p className="text-sm font-medium">Mileage: <span className="font-medium">{vehicle?.mileage !== undefined ? (
            <span className="font-medium">{vehicle.mileage}%</span>
          ) : (
            <span className="font-medium">Not Available</span>
          )}</span></p>
          <p className="text-sm font-medium">Rent Amount: <span className="font-medium">{formatCurrency(vehicle.rent_amount || 0)}</span></p>
          <p className="text-sm font-medium">Status: <Badge variant="secondary">{vehicle.status}</Badge></p>
          <p className="text-sm font-medium">Category: <span className="font-medium">Not specified</span></p>
          <p className="text-sm font-medium">Transmission: <span className="font-medium">Not specified</span></p>
          <p className="text-sm font-medium">Fuel Type: <span className="font-medium">Not specified</span></p>
          <p className="text-sm font-medium">Last Serviced: <span className="font-medium">Not recorded</span></p>
          <p className="text-sm font-medium">Next Service Due: <span className="font-medium">Not scheduled</span></p>
          <p className="text-sm font-medium">Insurance Company: <span className="font-medium">{vehicle.insurance_company || 'Not specified'}</span></p>
          <p className="text-sm font-medium">Insurance Expiry: <span className="font-medium">{vehicle.insurance_expiry ? format(new Date(vehicle.insurance_expiry), 'dd/MM/yyyy') : 'Not specified'}</span></p>
          <p className="text-sm font-medium">Location: <span className="font-medium">{vehicle.location || 'Not specified'}</span></p>
          <p className="text-sm font-medium">Description: <span className="font-medium">{vehicle.description || 'Not specified'}</span></p>
          <p className="text-sm font-medium">Features: <span className="font-medium"><span className="text-muted-foreground">No features listed</span></span></p>
          <p className="text-sm font-medium">Notes: {vehicle?.description ? (
            <p className="text-sm mt-1">{vehicle.description}</p>
          ) : (
            <span className="text-muted-foreground">No notes</span>
          )}</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={() => navigate(`/vehicles/edit/${vehicle.id}`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </CardFooter>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vehicle from our
              servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default VehicleDetail;
