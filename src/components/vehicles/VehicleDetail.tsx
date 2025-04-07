import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Edit, Trash2, Car, CalendarClock, Clock, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useVehicles } from '@/hooks/use-vehicles';
import { Vehicle } from '@/lib/validation-schemas/vehicle';
import { toast } from 'sonner';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDate, formatDateTime } from '@/lib/date-utils';
import { useAgreements, SimpleAgreement } from '@/hooks/use-agreements';
import { Skeleton } from '@/components/ui/skeleton';

export function VehicleDetail() {
  const { id: vehicleId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getVehicle, deleteVehicle } = useVehicles();
  const { agreements, isLoading: isLoadingAgreements, setSearchParams } = useAgreements();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchVehicle = useCallback(async () => {
    if (!vehicleId || hasLoaded) return;
    
    setLoading(true);
    setFetchError(null);
    
    try {
      const data = await getVehicle(vehicleId);
      if (data) {
        setVehicle(data);
        setHasLoaded(true);
      } else {
        setFetchError("Vehicle not found");
      }
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      setFetchError("Failed to load vehicle details");
      toast.error("Error loading vehicle details");
    } finally {
      setLoading(false);
    }
  }, [vehicleId, getVehicle, hasLoaded]);

  useEffect(() => {
    if (vehicleId) {
      setSearchParams({
        vehicle_id: vehicleId,
        status: 'all'
      });
    }
  }, [vehicleId, setSearchParams]);

  useEffect(() => {
    fetchVehicle();
  }, [fetchVehicle]);

  const handleDelete = async () => {
    if (!vehicle?.id || isDeleting) return;
    
    setIsDeleting(true);
    try {
      await deleteVehicle.mutateAsync(vehicle.id, {
        onSuccess: () => {
          toast.success("Vehicle deleted successfully");
          navigate('/vehicles');
        },
        onError: (error) => {
          console.error("Delete error:", error);
          toast.error("Failed to delete vehicle");
          setIsDeleting(false);
        }
      });
    } catch (error) {
      console.error("Unexpected error during delete:", error);
      toast.error("An unexpected error occurred");
      setIsDeleting(false);
    }
  };

  if (loading && !hasLoaded) {
    return <div className="flex justify-center items-center p-8">Loading vehicle details...</div>;
  }

  if (fetchError || !vehicle) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle>Vehicle Not Found</CardTitle>
          <CardDescription>
            {fetchError || "The vehicle you're looking for doesn't exist or has been removed."}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link to="/vehicles">Back to Vehicles</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{vehicle.make} {vehicle.model}</h2>
          <p className="text-muted-foreground">
            Vehicle added on {formatDate(vehicle.created_at || '')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline">
            <Link to={`/vehicles/edit/${vehicle.id}`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the vehicle record for {vehicle.make} {vehicle.model}.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Car className="mr-2 h-5 w-5" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Make & Model</h4>
              <p className="text-foreground">{vehicle.make} {vehicle.model}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">License Plate</h4>
              <p className="text-foreground">{vehicle.license_plate}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Year</h4>
              <p className="text-foreground">{vehicle.year}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Color</h4>
              <p className="text-foreground">{vehicle.color}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarClock className="mr-2 h-5 w-5" />
              Vehicle Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Status</h4>
              <Badge
                variant={
                  vehicle.status === "available" ? "success" : 
                  vehicle.status === "rented" ? "destructive" : 
                  vehicle.status === "maintenance" ? "warning" :
                  "secondary"
                }
                className="capitalize"
              >
                {vehicle.status}
              </Badge>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Daily Rate</h4>
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                QAR {vehicle.dailyRate}
              </code>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Last Updated</h4>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                {vehicle.updated_at 
                  ? formatDateTime(vehicle.updated_at) 
                  : 'Never updated'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Agreement History
          </CardTitle>
          <CardDescription>
            List of rental agreements associated with this vehicle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agreement Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingAgreements ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={`skeleton-cell-${i}-${j}`}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : agreements && agreements.length > 0 ? (
                  agreements.map((agreement) => (
                    <TableRow key={agreement.id}>
                      <TableCell className="font-medium">{agreement.agreement_number || 'N/A'}</TableCell>
                      <TableCell>
                        {agreement.customers ? (
                          <span>
                            {agreement.customers.full_name}
                          </span>
                        ) : (
                          'Unknown customer'
                        )}
                      </TableCell>
                      <TableCell>{agreement.start_date ? formatDate(agreement.start_date) : 'N/A'}</TableCell>
                      <TableCell>{agreement.end_date ? formatDate(agreement.end_date) : 'N/A'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            agreement.status === 'ACTIVE' ? 'success' :
                            agreement.status === 'PENDING' ? 'warning' :
                            agreement.status === 'CANCELLED' ? 'destructive' :
                            agreement.status === 'CLOSED' ? 'outline' :
                            agreement.status === 'EXPIRED' ? 'secondary' :
                            'default'
                          }
                          className="capitalize"
                        >
                          {agreement.status?.toLowerCase().replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{agreement.total_amount ? `QAR ${agreement.total_amount.toLocaleString()}` : 'N/A'}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/agreements/${agreement.id}`}>
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No agreements found for this vehicle.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            {vehicle.notes ? (
              <p className="whitespace-pre-line">{vehicle.notes}</p>
            ) : (
              <p className="text-muted-foreground italic">No additional notes for this vehicle.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
