
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
import { updateVehicleInfo } from '@/utils/vehicle-update';

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

  const handleStatusChange = async () => {
    try {
      setIsUpdating(true);
      
      const result = await updateVehicleInfo(vehicleId, {
        status: status
      });

      if (result.success) {
        toast.success("Vehicle status updated successfully");
        onStatusUpdated();
        onClose();
      } else {
        toast.error("Failed to update status", {
          description: result.message
        });
      }
    } catch (error) {
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
            <Badge>
              {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
            </Badge>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">New Status:</p>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as VehicleStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="stolen">Stolen</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
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
            {isUpdating ? "Updating..." : "Update Status"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatusUpdateDialog;
