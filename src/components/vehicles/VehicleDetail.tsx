
import { useState } from 'react';
import { Vehicle } from '@/types/vehicle';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { VehicleDetailTabs } from './VehicleDetailTabs';

interface VehicleDetailProps {
  vehicle: Vehicle;
  onDelete?: (id: string) => void;
}

export function VehicleDetail({ vehicle, onDelete }: VehicleDetailProps) {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Format vehicle name with make, model, and year
  const vehicleName = `${vehicle.make} ${vehicle.model} (${vehicle.year})`;
  
  // Handler for delete confirmation
  const handleDelete = async () => {
    try {
      if (onDelete) {
        await onDelete(vehicle.id);
      }
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
    }
  };
  
  // Get the status badge for the vehicle
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="success">Available</Badge>;
      case 'rented':
        return <Badge variant="default">Rented</Badge>;
      case 'reserved':
      case 'reserve':
        return <Badge variant="warning">Reserved</Badge>;
      case 'maintenance':
        return <Badge variant="outline">Maintenance</Badge>;
      case 'police_station':
        return <Badge variant="destructive">Police Station</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <CardTitle className="text-2xl">{vehicleName}</CardTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            {getStatusBadge(vehicle.status || 'unknown')}
            <Badge variant="outline">{vehicle.license_plate}</Badge>
            {vehicle.vehicleType && (
              <Badge variant="secondary">{vehicle.vehicleType.name}</Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/vehicles/edit/${vehicle.id}`)}>
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      </CardHeader>

      <VehicleDetailTabs vehicle={vehicle} onDelete={onDelete} />
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {vehicleName}? This action cannot be undone, 
              and all associated rental history will be permanently affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
