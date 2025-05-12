
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useVehicleStatus } from '@/hooks/use-vehicle-status';

interface VehicleStatusUpdateDialogProps {
  isOpen: boolean;
  onClose: (confirmed?: boolean) => void;
  vehicleId: string;
  targetStatus: 'available' | 'maintenance';
  title: string;
  description: string;
  confirmLabel: string;
}

export const VehicleStatusUpdateDialog: React.FC<VehicleStatusUpdateDialogProps> = ({
  isOpen,
  onClose,
  vehicleId,
  title,
  description,
  confirmLabel,
}) => {
  const { isUpdating } = useVehicleStatus(vehicleId);

  const handleConfirm = () => {
    onClose(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isUpdating}>
            {isUpdating ? 'Updating...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
