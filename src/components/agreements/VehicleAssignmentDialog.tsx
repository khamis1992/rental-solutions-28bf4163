
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VehicleService } from '@/services/vehicles/vehicles-service';

interface VehicleAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  vehicleId: string;
  existingAgreement: {
    id: string;
    agreement_number: string;
  };
}

export function VehicleAssignmentDialog({
  isOpen,
  onClose,
  onConfirm,
  vehicleId,
  existingAgreement,
}: VehicleAssignmentDialogProps) {
  const [vehicleInfo, setVehicleInfo] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && vehicleId) {
      fetchVehicleInfo();
    }
  }, [isOpen, vehicleId]);

  async function fetchVehicleInfo() {
    if (!vehicleId) {
      setVehicleInfo('Vehicle information not available');
      setLoading(false);
      return;
    }
    
    const vehicle = await VehicleService.getVehicle(vehicleId);
    
    if (vehicle) {
      setVehicleInfo(`${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`);
    } else {
      setVehicleInfo('Vehicle information not available');
    }
    
    setLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vehicle Assignment Conflict</DialogTitle>
          <DialogDescription>
            This vehicle is currently assigned to another agreement.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p>
            Vehicle:
            {loading ? ' Loading...' : ` ${vehicleInfo}`}
          </p>
          <p className="mt-2">
            Existing Agreement: #{existingAgreement.agreement_number}
          </p>
          <p className="mt-4 font-semibold text-red-500">
            To proceed, the existing agreement must be terminated.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
          >
            Terminate Existing Agreement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default VehicleAssignmentDialog;
