import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Car, User, AlertTriangle, CheckCircle } from 'lucide-react';

interface VehicleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId?: string;
  vehicleId?: string;
}

export function VehicleAssignmentDialog({
  open,
  onOpenChange,
  agreementId,
  vehicleId,
}: VehicleAssignmentDialogProps) {
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssignVehicle = async () => {
    if (!agreementId || !vehicleId) {
      toast.error('Agreement ID or Vehicle ID is missing.');
      return;
    }

    setIsAssigning(true);
    try {
      // Simulate assigning the vehicle
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success('Vehicle assigned successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning vehicle:', error);
      toast.error('Failed to assign vehicle.');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Vehicle</DialogTitle>
          <DialogDescription>
            Confirm the assignment of this vehicle to the agreement.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Card>
            <CardContent className="flex items-center space-x-4">
              <Car className="h-6 w-6 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-medium">Vehicle Information</h3>
                <p className="text-xs text-muted-foreground">
                  Make: Toyota, Model: Camry, License Plate: ABC-123
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center space-x-4">
              <User className="h-6 w-6 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-medium">Customer Information</h3>
                <p className="text-xs text-muted-foreground">
                  Name: John Doe, Email: john.doe@example.com
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <Separator />
        <div className="flex justify-end mt-4">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleAssignVehicle} disabled={isAssigning}>
            {isAssigning ? (
              <>
                Assigning...
              </>
            ) : (
              'Assign Vehicle'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
