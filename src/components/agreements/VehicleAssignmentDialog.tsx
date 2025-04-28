import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { asDbId } from '@/types/database-common';
import { asVehicleId, asLeaseId, castPaymentStatus } from '@/types/database-types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PaymentWarningSection } from './vehicle-assignment/PaymentWarningSection';

interface VehicleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId: string;
  currentVehicleId?: string | null;
  onVehicleAssigned: () => void;
}

const VehicleAssignmentDialog: React.FC<VehicleAssignmentDialogProps> = ({
  open,
  onOpenChange,
  agreementId,
  currentVehicleId,
  onVehicleAssigned,
}) => {
  const [vehicleId, setVehicleId] = useState('');
  const [isTransferringPayments, setIsTransferringPayments] = useState(false);
  const { toast } = useToast();

  const handleVehicleAssignment = async () => {
    if (!vehicleId) {
      toast({
        title: 'Error',
        description: 'Please enter a vehicle ID.',
        variant: 'destructive',
      });
      return;
    }

    // Store the old vehicle ID for payment transfers
    const oldVehicleId = currentVehicleId;

    try {
      // Update the lease with the new vehicle ID
      const { data: updatedLease, error: leaseUpdateError } = await supabase
        .from('leases')
        .update({ vehicle_id: asVehicleId(vehicleId) })
        .eq('id', asLeaseId(agreementId))
        .select();

      if (leaseUpdateError) {
        throw new Error(`Failed to update lease: ${leaseUpdateError.message}`);
      }

      // Check if the lease was actually updated
      if (!updatedLease || updatedLease.length === 0) {
        throw new Error('Lease not found or not updated.');
      }

      // When updating the vehicle status
      const { error: updateVehicleError } = await supabase
        .from('vehicles')
        .update({ status: 'rented' })
        .eq('id', asVehicleId(vehicleId));

      if (updateVehicleError) {
        throw new Error(`Failed to update vehicle status: ${updateVehicleError.message}`);
      }

      // Transfer payments if the option is selected
      if (isTransferringPayments && oldVehicleId) {
        // When updating payment status
        const { error: paymentUpdateError } = await supabase
          .from('unified_payments')
          .update({ lease_id: asLeaseId(agreementId) })
          .eq('lease_id', asLeaseId(oldVehicleId));

        if (paymentUpdateError) {
          console.error('Failed to update payments:', paymentUpdateError);
          toast({
            title: 'Warning',
            description: 'Failed to transfer payments. Please update manually.',
            variant: 'warning',
          });
        }

        // When updating traffic fines
        const { error: trafficFineError } = await supabase
          .from('traffic_fines')
          .update({ 
            lease_id: asLeaseId(agreementId),
            payment_status: castPaymentStatus('pending') 
          })
          .eq('lease_id', asLeaseId(oldVehicleId));

        if (trafficFineError) {
          console.error('Failed to update traffic fines:', trafficFineError);
          toast({
            title: 'Warning',
            description: 'Failed to transfer traffic fines. Please update manually.',
            variant: 'warning',
          });
        }
      }

      // When checking for customer_id
      if (updatedLease && updatedLease[0] && updatedLease[0].customer_id) {
        const customerId = updatedLease[0].customer_id;
        // Use customerId safely here
      }

      toast({
        title: 'Success',
        description: 'Vehicle assigned successfully!',
      });
      onVehicleAssigned();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to assign vehicle. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Vehicle</DialogTitle>
          <DialogDescription>
            Assign a vehicle to this agreement.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="vehicleId" className="text-right">
              Vehicle ID
            </Label>
            <Input
              type="text"
              id="vehicleId"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="col-span-3"
            />
          </div>
          <PaymentWarningSection agreementId={agreementId} currentVehicleId={currentVehicleId} />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="transfer"
              checked={isTransferringPayments}
              onCheckedChange={(checked) => setIsTransferringPayments(checked || false)}
            />
            <Label htmlFor="transfer">Transfer Payments</Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleVehicleAssignment}>
            Assign Vehicle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleAssignmentDialog;
