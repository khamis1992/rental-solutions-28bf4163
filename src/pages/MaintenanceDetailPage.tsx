
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogCancel, AlertDialogAction, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageContainer from '@/components/layout/PageContainer';
import { Separator } from '@/components/ui/separator';
import { Pencil, Trash2, Calendar, Car, ClipboardList, CreditCard, MapPin, User, CheckCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMaintenance } from '@/hooks/use-maintenance';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

const MaintenanceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useOne, useDelete } = useMaintenance();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: maintenance, isLoading, error } = useOne(id!);
  const deleteMutation = useDelete;

  if (isLoading) {
    return (
      <PageContainer title="Maintenance Details" backLink="/maintenance">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  if (error || !maintenance) {
    return (
      <PageContainer title="Maintenance Not Found" backLink="/maintenance">
        <Card className="bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The maintenance record you're looking for could not be found.</p>
            <Button 
              className="mt-4" 
              onClick={() => navigate('/maintenance')}
              variant="outline"
            >
              Back to Maintenance List
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  // Format dates with a fallback
  const formatDate = (date: string | null) => {
    if (!date) return 'Not specified';
    try {
      return format(new Date(date), 'PPP');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const handleDelete = () => {
    if (!id) return;
    
    deleteMutation.mutate(id, {
      onSuccess: () => {
        navigate('/maintenance');
      }
    });
  };

  // Fetch vehicle details since they might not be included in the maintenance record
  const [vehicleDetails, setVehicleDetails] = useState<any>(null);
  
  React.useEffect(() => {
    const fetchVehicleDetails = async () => {
      if (maintenance?.vehicle_id) {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', maintenance.vehicle_id)
          .single();
        
        if (!error && data) {
          setVehicleDetails(data);
        }
      }
    };

    fetchVehicleDetails();
  }, [maintenance?.vehicle_id]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <PageContainer 
      title="Maintenance Details" 
      backLink="/maintenance"
      actions={
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(`/maintenance/edit/${id}`)}
          >
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      }
    >
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{maintenance.maintenance_type?.replace(/_/g, ' ') || 'Maintenance'}</CardTitle>
              <div className="mt-1">
                <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusBadgeClass(maintenance.status)}`}>
                  {maintenance.status?.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-muted-foreground text-sm flex items-center justify-end">
                <Clock className="h-4 w-4 mr-1" />
                Created: {formatDate(maintenance.created_at)}
              </div>
              {maintenance.status === 'completed' && maintenance.completed_date && (
                <div className="text-muted-foreground text-sm flex items-center justify-end mt-1">
                  <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                  Completed: {formatDate(maintenance.completed_date)}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Scheduled Date
                </h3>
                <p className="text-muted-foreground">{formatDate(maintenance.scheduled_date)}</p>
              </div>
              <div>
                <h3 className="font-medium flex items-center">
                  <Car className="h-4 w-4 mr-2" />
                  Vehicle
                </h3>
                <p className="text-muted-foreground">
                  {vehicleDetails ? 
                    `${vehicleDetails.make} ${vehicleDetails.model} (${vehicleDetails.license_plate})` : 
                    `Vehicle ID: ${maintenance.vehicle_id}`
                  }
                </p>
              </div>
              <div>
                <h3 className="font-medium flex items-center">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Maintenance Type
                </h3>
                <p className="text-muted-foreground">
                  {maintenance.maintenance_type?.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Cost
                </h3>
                <p className="text-muted-foreground">
                  {maintenance.cost ? `$${maintenance.cost.toFixed(2)}` : 'Not specified'}
                </p>
              </div>
              <div>
                <h3 className="font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Service Provider
                </h3>
                <p className="text-muted-foreground">
                  {maintenance.service_provider || maintenance.performed_by || 'Not specified'}
                </p>
              </div>
              <div>
                <h3 className="font-medium flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Invoice Number
                </h3>
                <p className="text-muted-foreground">
                  {maintenance.invoice_number || 'Not specified'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-muted-foreground">
              {maintenance.description || 'No description provided.'}
            </p>
          </div>

          {maintenance.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">Additional Notes</h3>
                <p className="text-muted-foreground">{maintenance.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the maintenance record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default MaintenanceDetailPage;
