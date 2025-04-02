
import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link } from 'react-router-dom';
import { checkVehicleBookingConflicts, resolveVehicleBookingConflicts } from '@/utils/agreement-conflicts';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface ConflictAlertProps {
  agreementId: string;
  vehicleId: string;
  onResolved?: () => void;
}

export const ConflictAlert: React.FC<ConflictAlertProps> = ({ 
  agreementId, 
  vehicleId,
  onResolved
}) => {
  const [loading, setLoading] = useState(true);
  const [hasConflicts, setHasConflicts] = useState(false);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const checkConflicts = async () => {
    setLoading(true);
    try {
      const result = await checkVehicleBookingConflicts(vehicleId, agreementId);
      setHasConflicts(result.hasConflicts);
      setConflicts(result.conflicts || []);
    } catch (error) {
      console.error("Error checking conflicts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vehicleId) {
      checkConflicts();
    }
  }, [vehicleId, agreementId]);

  const handleResolveConflicts = async () => {
    setIsResolving(true);
    try {
      const result = await resolveVehicleBookingConflicts(vehicleId, agreementId);
      if (result) {
        toast.success("Successfully resolved vehicle booking conflicts");
        setIsDialogOpen(false);
        setHasConflicts(false);
        setConflicts([]);
        if (onResolved) {
          onResolved();
        }
      }
    } catch (error) {
      console.error("Error resolving conflicts:", error);
      toast.error("Failed to resolve conflicts");
    } finally {
      setIsResolving(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-20 w-full" />;
  }

  if (!hasConflicts) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Vehicle Double-Booking Detected</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>
          This vehicle is currently assigned to {conflicts.length} other active agreement{conflicts.length > 1 ? 's' : ''}.
          This may cause scheduling conflicts.
        </p>
        
        <div className="flex gap-2 mt-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                View Conflicts
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Vehicle Booking Conflicts</DialogTitle>
                <DialogDescription>
                  This vehicle is currently assigned to multiple active agreements.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 my-4 max-h-[50vh] overflow-y-auto">
                {conflicts.map(conflict => (
                  <div key={conflict.id} className="border rounded p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Agreement #{conflict.agreement_number}</span>
                      <Link 
                        to={`/agreements/${conflict.id}`} 
                        className="text-blue-600 hover:underline"
                        target="_blank"
                      >
                        View
                      </Link>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Customer: {conflict.customers?.full_name || 'N/A'}</p>
                      <p>
                        Period: {format(new Date(conflict.start_date), 'MMM d, yyyy')} - {format(new Date(conflict.end_date), 'MMM d, yyyy')}
                      </p>
                      <p>Created: {format(new Date(conflict.created_at), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <DialogFooter>
                <Button 
                  variant="destructive" 
                  onClick={handleResolveConflicts}
                  disabled={isResolving}
                >
                  <Ban className="h-4 w-4 mr-1" />
                  {isResolving ? 'Cancelling...' : 'Cancel Conflicting Agreements'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleResolveConflicts}
            disabled={isResolving}
          >
            <Ban className="h-4 w-4 mr-1" />
            {isResolving ? 'Cancelling...' : 'Cancel Conflicting Agreements'}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
