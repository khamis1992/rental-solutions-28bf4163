
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVehicleDetail } from '@/hooks/use-vehicle-detail';
import { useVehicleStatus } from '@/hooks/use-vehicle-status';
import { useVehicleDelete } from '@/hooks/use-vehicle-delete';
import { useVehicleMaintenanceHistory } from '@/hooks/use-vehicle-maintenance';
import { useVehicleAgreements } from '@/hooks/use-vehicle-agreements';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Vehicle } from '@/types/vehicle';
import { MaintenanceRecord } from '@/components/maintenance/MaintenanceRecord';
import { AgreementCard } from '@/components/agreements/AgreementCard';
import { VehicleStatusBadge } from '@/components/vehicles/VehicleStatusBadge';
import { VehicleImageGallery } from '@/components/vehicles/VehicleImageGallery';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Calendar, Car, FileText, Wrench, AlertTriangle, Edit, Trash, Plus, ArrowLeft } from 'lucide-react';

const VehicleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use the new hook for vehicle details
  const { vehicle, isLoading, error, refetch } = useVehicleDetail(id);
  const { updateStatus, isUpdating } = useVehicleStatus(id);
  const { deleteVehicle, isDeleting } = useVehicleDelete();
  const { maintenanceRecords, isLoading: isLoadingMaintenance } = useVehicleMaintenanceHistory(id);
  const { agreements, isLoading: isLoadingAgreements } = useVehicleAgreements(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-1/4" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Error Loading Vehicle
          </CardTitle>
          <CardDescription>
            There was a problem loading the vehicle details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error?.message || "The vehicle could not be found or you don't have permission to view it."}
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => navigate('/vehicles')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vehicles
          </Button>
          <Button variant="outline" onClick={() => refetch()} className="ml-2">
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus(newStatus);
      toast({
        title: "Status Updated",
        description: `Vehicle status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Status Update Failed",
        description: "There was a problem updating the vehicle status.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteVehicle(vehicle.id);
      toast({
        title: "Vehicle Deleted",
        description: "The vehicle has been successfully deleted.",
      });
      navigate('/vehicles');
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "There was a problem deleting the vehicle.",
        variant: "destructive",
      });
    }
  };

  const isAvailable = vehicle.status === 'available';
  const isInMaintenance = vehicle.status === 'maintenance';
  const isRented = vehicle.status === 'rented';

  // Get the current or most recent agreement
  const currentAgreement = agreements?.find(a => a.status === 'active');
  const mostRecentAgreement = agreements?.length ? agreements[0] : null;

  // Format vehicle details for display
  const vehicleDetails = [
    { label: "Make", value: vehicle.make },
    { label: "Model", value: vehicle.model },
    { label: "Year", value: vehicle.year },
    { label: "Color", value: vehicle.color },
    { label: "License Plate", value: vehicle.license_plate },
    { label: "VIN", value: vehicle.vin },
    { label: "Mileage", value: vehicle.mileage ? `${vehicle.mileage} km` : "Not recorded" },
    { label: "Daily Rate", value: vehicle.daily_rate ? formatCurrency(vehicle.daily_rate) : "Not set" },
    { label: "Monthly Rate", value: vehicle.monthly_rate ? formatCurrency(vehicle.monthly_rate) : "Not set" },
    { label: "Type", value: vehicle.vehicle_type?.name || "Standard" },
    { label: "Description", value: vehicle.vehicle_type?.description || "No description available" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">
            {vehicle.make} {vehicle.model} ({vehicle.year})
          </h2>
          <p className="text-muted-foreground">
            {vehicle.license_plate}
            <VehicleStatusBadge status={vehicle.status} className="ml-2" />
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigate(`/vehicles/edit/${vehicle.id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the vehicle
                  and all associated records.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Vehicle Details</CardTitle>
            <CardDescription>
              Complete information about this vehicle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <VehicleImageGallery 
              mainImage={vehicle.image_url} 
              additionalImages={vehicle.additional_images || []} 
            />
            
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
                <Button onClick={() => handleStatusChange('available')}>
                  <Car className="mr-2 h-4 w-4" />
                  Mark as Available
                </Button>
              )}
              {!isInMaintenance && (
                <Button variant="outline" onClick={() => handleStatusChange('maintenance')}>
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
                
                {isRented && currentAgreement && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Current Rental</p>
                      <p className="text-sm">
                        <span className="font-medium">Customer:</span> {currentAgreement.customer_name || 'Unknown'}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Until:</span> {formatDate(currentAgreement.end_date)}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => navigate(`/agreements/${currentAgreement.id}`)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        View Agreement
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
          <TabsTrigger value="schedule" className="flex items-center">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="agreements" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Rental History</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/agreements/new?vehicle_id=${vehicle.id}`)}
              disabled={!isAvailable}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Agreement
            </Button>
          </div>
          
          {isLoadingAgreements ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : agreements && agreements.length > 0 ? (
            <div className="space-y-4">
              {agreements.map(agreement => (
                <AgreementCard 
                  key={agreement.id} 
                  agreement={agreement} 
                  onClick={() => navigate(`/agreements/${agreement.id}`)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No agreements found for this vehicle.
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="maintenance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Maintenance Records</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/maintenance/add?vehicle_id=${vehicle.id}`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Record
            </Button>
          </div>
          
          {isLoadingMaintenance ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : maintenanceRecords && maintenanceRecords.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4 pr-4">
                {maintenanceRecords.map(record => (
                  <MaintenanceRecord 
                    key={record.id} 
                    record={record} 
                    onClick={() => navigate(`/maintenance/${record.id}`)}
                  />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No maintenance records found for this vehicle.
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Schedule</CardTitle>
              <CardDescription>
                Upcoming reservations and maintenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Schedule view is coming soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VehicleDetail;
