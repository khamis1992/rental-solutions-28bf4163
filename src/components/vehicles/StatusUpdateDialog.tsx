
import React from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VehicleStatus } from '@/types/vehicle';
import { updateVehicleStatus } from '@/utils/vehicle-update';
import { Loader2 } from 'lucide-react';

interface StatusUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: VehicleStatus;
  vehicleId: string;
  vehicleDetails: {
    make: string;
    model: string;
    licensePlate: string;
  };
  onStatusUpdated: () => void;
}

const StatusUpdateDialog = ({
  isOpen,
  onClose,
  currentStatus,
  vehicleId,
  vehicleDetails,
  onStatusUpdated
}: StatusUpdateDialogProps) => {
  const [status, setStatus] = React.useState<VehicleStatus>(currentStatus);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Reset status when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      console.log(`StatusUpdateDialog: Setting initial status to ${currentStatus}`);
      setStatus(currentStatus);
    }
  }, [isOpen, currentStatus]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'stolen':
        return 'destructive';
      case 'maintenance':
        return 'warning';
      case 'retired':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleStatusChange = async () => {
    if (status === currentStatus) {
      toast.info("No changes to save");
      return;
    }

    try {
      setIsUpdating(true);
      console.log(`Attempting to update vehicle ${vehicleId} status from ${currentStatus} to ${status}`);
      
      // Ensure status is one of the allowed VehicleStatus values before calling API
      const validStatuses: VehicleStatus[] = [
        'available', 'rented', 'reserved', 'maintenance', 
        'police_station', 'accident', 'stolen', 'retired'
      ];
      
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }
      
      const result = await updateVehicleStatus(vehicleId, status);

      if (result.success) {
        toast.success("Vehicle status updated successfully");
        console.log("Status update result:", result);
        await onStatusUpdated();  // Make sure to await this to complete the refresh
        onClose();
      } else {
        console.error("Status update failed:", result.message);
        toast.error("Failed to update status", {
          description: result.message
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error updating status", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Vehicle Status</DialogTitle>
          <DialogDescription>
            {vehicleDetails.make} {vehicleDetails.model} ({vehicleDetails.licensePlate})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm font-medium mb-2">Current Status:</p>
            <Badge variant={getStatusBadgeVariant(currentStatus)}>
              {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
            </Badge>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">New Status:</p>
            <Select
              value={status}
              onValueChange={(value) => {
                console.log(`StatusUpdateDialog: Changing status from ${status} to ${value}`);
                setStatus(value as VehicleStatus);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="stolen">Stolen</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="police_station">Police Station</SelectItem>
                <SelectItem value="accident">Accident</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStatusChange}
            disabled={status === currentStatus || isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Status"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatusUpdateDialog;
