
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
import { supabase } from '@/integrations/supabase/client';
import { asVehicleId, isValidResponse } from "@/utils/database-type-helpers";

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
    // Only fetch vehicle info when dialog is open and we have a vehicle ID
    if (isOpen && vehicleId) {
      fetchVehicleInfo();
    }
  }, [isOpen, vehicleId]);

  /**
   * Fetch vehicle information from the database
   */
  async function fetchVehicleInfo() {
    try {
      if (!vehicleId) {
        setVehicleInfo('Vehicle information not available');
        setLoading(false);
        return;
      }
      
      const vehicleIdTyped = asVehicleId(vehicleId);
      const response = await supabase
        .from('vehicles')
        .select('make, model, license_plate')
        .eq('id', vehicleIdTyped)
        .single();

      if (response.error) throw response.error;

      if (isValidResponse(response)) {
        setVehicleInfo(`${response.data.make} ${response.data.model} (${response.data.license_plate})`);
      } else {
        setVehicleInfo('Vehicle information not available');
      }
    } catch (error) {
      console.error("Error fetching vehicle info:", error);
      setVehicleInfo('Error loading vehicle information');
    } finally {
      setLoading(false);
    }
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
