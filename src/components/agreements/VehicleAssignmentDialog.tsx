
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
    async function fetchVehicleInfo() {
      try {
        if (!vehicleId) {
          setVehicleInfo('Vehicle information not available');
          setLoading(false);
          return;
        }
        
        const vehicleIdTyped = asVehicleId(vehicleId);
        const { data, error } = await supabase
          .from('vehicles')
          .select('make, model, license_plate')
          .eq('id', vehicleIdTyped)
          .single();

        if (error) throw error;

        if (isValidResponse({ data, error }) && data) {
          setVehicleInfo(`${data.make} ${data.model} (${data.license_plate})`);
        }
      } catch (error) {
        console.error("Error fetching vehicle info:", error);
      } finally {
        setLoading(false);
      }
    }

    if (isOpen && vehicleId) {
      fetchVehicleInfo();
    }
  }, [isOpen, vehicleId]);

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
