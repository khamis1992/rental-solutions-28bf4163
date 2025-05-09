
import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2 } from 'lucide-react';
import { useVehicleStatus } from '@/hooks/use-vehicle-status';

interface VehicleStatusUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId?: string;
  targetStatus: 'available' | 'maintenance';
  title: string;
  description: string;
  confirmLabel: string;
}

export const VehicleStatusUpdateDialog: React.FC<VehicleStatusUpdateDialogProps> = ({
  isOpen,
  onClose,
  vehicleId,
  targetStatus,
  title,
  description,
  confirmLabel,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { updateStatus } = useVehicleStatus(vehicleId);

  const handleUpdateStatus = async () => {
    if (!vehicleId) return;
    
    setIsUpdating(true);
    try {
      await updateStatus(targetStatus);
      onClose();
    } catch (error) {
      console.error('Error updating vehicle status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !isUpdating && !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUpdateStatus}
            disabled={isUpdating}
            className={targetStatus === 'maintenance' ? 'bg-amber-500 hover:bg-amber-600' : ''}
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
