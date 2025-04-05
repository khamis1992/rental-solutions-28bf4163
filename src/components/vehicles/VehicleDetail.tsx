
import { useState, useEffect } from 'react';
import { Vehicle } from '@/types/vehicle';
import { useNavigate } from 'react-router-dom';
import { useVehicles } from '@/hooks/use-vehicles';
import { useAgreements } from '@/hooks/use-agreements';
import { SimpleAgreement } from '@/types/agreement';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Car, Clock, Wrench, Gauge, Info, AlertTriangle, FileText, Edit, Trash2 } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface VehicleDetailProps {
  vehicle: Vehicle;
  onDelete?: (id: string) => void;
}

export function VehicleDetail({ vehicle, onDelete }: VehicleDetailProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Fetch vehicle data
  const { useVehicle, useDeleteVehicle } = useVehicles();
  const { data: vehicleData, isLoading: isLoadingVehicle, error: vehicleError } = useVehicle(vehicle.id);
  
  // Fetch vehicle agreements
  const { agreements, isLoading: isLoadingAgreements } = useAgreements({ 
    vehicleId: vehicle.id 
  });
  
  // Setup delete mutation
  const deleteVehicle = useDeleteVehicle();
  
  if (isLoadingVehicle) {
    return <Card><CardContent className="pt-6"><Skeleton className="h-[400px] w-full" /></CardContent></Card>;
  }
  
  if (vehicleError || !vehicleData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="p-4 bg-destructive/10 text-destructive rounded-md flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">Error Loading Vehicle</h3>
              <p className="text-sm">{vehicleError instanceof Error ? vehicleError.message : 'Vehicle not found'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Format vehicle name with make, model, and year
  const vehicleName = `${vehicleData.make} ${vehicleData.model} (${vehicleData.year})`;
  
  // Handler for delete confirmation
  const handleDelete = async () => {
    try {
      await deleteVehicle.mutateAsync(vehicle.id);
      setDeleteDialogOpen(false);
      if (onDelete) {
        onDelete(vehicle.id);
      } else {
        // Navigate back to vehicles list
        navigate('/vehicles');
      }
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
            {getStatusBadge(vehicleData.status || 'unknown')}
            <Badge variant="outline">{vehicleData.license_plate}</Badge>
            {vehicleData.vehicleType && (
              <Badge variant="secondary">{vehicleData.vehicleType.name}</Badge>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-1">
        <TabsList className="grid grid-cols-3 mb-4 mx-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Rental History</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="p-0">
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Vehicle Details</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground w-28">Make:</span>
                    <span className="font-medium">{vehicleData.make}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground w-28">Model:</span>
                    <span className="font-medium">{vehicleData.model}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground w-28">Year:</span>
                    <span className="font-medium">{vehicleData.year}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground w-28">VIN:</span>
                    <span className="font-medium font-mono text-sm">{vehicleData.vin}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground w-28">License Plate:</span>
                    <span className="font-medium">{vehicleData.license_plate}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground w-28">Color:</span>
                    <span className="font-medium">{vehicleData.color || 'N/A'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground w-28">Mileage:</span>
                    <span className="font-medium">{vehicleData.mileage ? `${vehicleData.mileage.toLocaleString()} km` : 'N/A'}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground w-28">Location:</span>
                    <span className="font-medium">{vehicleData.location || 'N/A'}</span>
                  </li>
                  {vehicleData.vehicleType && (
                    <li className="flex justify-between">
                      <span className="text-muted-foreground w-28">Daily Rate:</span>
                      <span className="font-medium">{formatCurrency(vehicleData.vehicleType.daily_rate || 0)}</span>
                    </li>
                  )}
                </ul>
              </div>
              
              <div>
                <div className="rounded-md border overflow-hidden aspect-video mb-4">
                  {vehicleData.image_url ? (
                    <img 
                      src={vehicleData.image_url} 
                      alt={vehicleName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Car className="h-12 w-12 text-muted-foreground opacity-50" />
                      <span className="text-muted-foreground ml-2">No image available</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">
                      Added on {format(new Date(vehicleData.created_at), 'dd MMMM yyyy')}
                    </span>
                  </div>
                  
                  {vehicleData.status === 'rented' && (
                    <div className="flex items-center text-amber-600">
                      <Info className="h-4 w-4 mr-2" />
                      <span className="text-sm">
                        Currently rented out
                      </span>
                    </div>
                  )}
                  
                  {vehicleData.status === 'maintenance' && (
                    <div className="flex items-center text-orange-600">
                      <Wrench className="h-4 w-4 mr-2" />
                      <span className="text-sm">
                        Under maintenance
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Additional Details Section */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center">
                      <Gauge className="h-8 w-8 mb-2 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Mileage</span>
                      <span className="text-2xl font-bold">{vehicleData.mileage ? vehicleData.mileage.toLocaleString() : 'N/A'}</span>
                      <span className="text-sm text-muted-foreground">kilometers</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center">
                      <FileText className="h-8 w-8 mb-2 text-green-500" />
                      <span className="text-sm text-muted-foreground">Insurance</span>
                      <span className="text-lg font-bold">{vehicleData.insurance_company || 'N/A'}</span>
                      <span className="text-sm text-muted-foreground">
                        {vehicleData.insurance_expiry 
                          ? `Expires: ${format(new Date(vehicleData.insurance_expiry), 'dd/MM/yyyy')}` 
                          : 'No expiry date'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center">
                      <Clock className="h-8 w-8 mb-2 text-purple-500" />
                      <span className="text-sm text-muted-foreground">Rental History</span>
                      <span className="text-2xl font-bold">{agreements?.length || 0}</span>
                      <span className="text-sm text-muted-foreground">total rentals</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="history" className="p-0">
          <CardContent>
            <h3 className="text-lg font-semibold mb-4">Rental History</h3>
            
            {isLoadingAgreements ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : agreements && agreements.length > 0 ? (
              <div className="rounded-md border overflow-hidden">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Agreement #</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Customer</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Period</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {agreements.map((agreement: SimpleAgreement) => (
                      <tr key={agreement.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 text-sm">
                          <Button variant="link" className="p-0 h-auto" onClick={() => navigate(`/agreements/${agreement.id}`)}>
                            {agreement.agreement_number}
                          </Button>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {(agreement.customer?.full_name || agreement.customers?.full_name) || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {format(new Date(agreement.start_date), 'MMM d, yyyy')} - {format(new Date(agreement.end_date), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant={
                            agreement.status === 'ACTIVE' ? 'success' :
                            agreement.status === 'PENDING' ? 'warning' :
                            agreement.status === 'EXPIRED' ? 'secondary' :
                            'outline'
                          }>
                            {agreement.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {formatCurrency(agreement.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-muted/10">
                <Car className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
                <h4 className="text-lg font-medium mb-2">No rental history found</h4>
                <p className="text-muted-foreground mb-4">This vehicle hasn't been rented out yet.</p>
                <Button onClick={() => navigate('/agreements/new', { state: { vehicleId: vehicle.id } })}>
                  Create New Agreement
                </Button>
              </div>
            )}
          </CardContent>
        </TabsContent>
        
        <TabsContent value="maintenance" className="p-0">
          <CardContent>
            <h3 className="text-lg font-semibold mb-4">Maintenance Records</h3>
            
            {/* Maintenance placeholder - would integrate with actual maintenance records */}
            <div className="text-center py-12 border rounded-lg bg-muted/10">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
              <h4 className="text-lg font-medium mb-2">No maintenance records</h4>
              <p className="text-muted-foreground mb-4">There are no maintenance records for this vehicle.</p>
              <Button variant="outline">Schedule Maintenance</Button>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
      
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
