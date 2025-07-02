import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogCancel, AlertDialogAction, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageContainer from '@/components/layout/PageContainer';
import { Separator } from '@/components/ui/separator';

import { Skeleton } from '@/components/ui/skeleton';
import { useMaintenance } from '@/hooks/use-maintenance';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle } from 'lucide-react';

const MaintenanceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useMaintenanceDetails, useDeleteMaintenance } = useMaintenance();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: maintenance, isLoading, error } = useMaintenanceDetails(id!);
  const deleteMutation = useDeleteMaintenance();

  if (isLoading) {
    return (
      <PageContainer title="Maintenance Details">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </PageContainer>
    );
  }

  if (error || !maintenance) {
    return (
      <PageContainer title="Maintenance Not Found">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Maintenance Record Not Found</h3>
          <p className="text-muted-foreground">
            The maintenance record you're looking for doesn't exist or has been removed.
          </p>
        </div>
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      scheduled: "secondary", 
      in_progress: "outline",
      cancelled: "destructive"
    };
    return variants[status] || "outline";
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      high: "destructive",
      medium: "secondary",
      low: "outline"
    };
    return variants[priority] || "outline";
  };

  return (
    <PageContainer 
      title="Maintenance Details" 
      description={`Details for maintenance record #${maintenance.id}`}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge variant={getStatusBadge(maintenance.status)}>
                  {maintenance.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Priority</label>
              <div className="mt-1">
                <Badge variant={getPriorityBadge(maintenance.priority)}>
                  {maintenance.priority.toUpperCase()}
                </Badge>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Vehicle</label>
              <p className="mt-1">{vehicleDetails ? 
                `${vehicleDetails.make} ${vehicleDetails.model} (${vehicleDetails.license_plate})` : 
                `Vehicle ID: ${maintenance.vehicle_id}`
              }</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <p className="mt-1">{maintenance.maintenance_type?.replace(/_/g, ' ')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule & Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Scheduled Date</label>
              <p className="mt-1">{formatDate(maintenance.scheduled_date)}</p>
            </div>
            
            {maintenance.completed_date && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Completed Date</label>
                <p className="mt-1">{formatDate(maintenance.completed_date)}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <p className="mt-1">{formatDate(maintenance.created_at)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Description & Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1">{maintenance.description || 'No description provided'}</p>
              </div>
              
              {maintenance.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="mt-1">{maintenance.notes}</p>
                </div>
              )}
              
              {maintenance.cost && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cost</label>
                  <p className="mt-1 text-lg font-semibold">QAR {maintenance.cost.toLocaleString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
