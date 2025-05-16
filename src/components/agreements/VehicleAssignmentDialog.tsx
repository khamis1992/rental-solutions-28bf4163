
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import VehicleSelector from '@/components/agreements/selectors/VehicleSelector';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { asUUID } from '@/lib/uuid-helpers';

interface VehicleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaseId: string;
  currentVehicleId?: string;
  onAssignmentComplete?: () => void;
}

export function VehicleAssignmentDialog({
  open,
  onOpenChange,
  leaseId,
  currentVehicleId,
  onAssignmentComplete
}: VehicleAssignmentDialogProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  async function handleVehicleAssignment() {
    if (!selectedVehicleId) {
      toast({
        title: "Selection Required",
        description: "Please select a vehicle to assign",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // If there's a current vehicle, update its status to available
      if (currentVehicleId) {
        const { error: currentVehicleError } = await supabase
          .from('vehicles')
          .update({ status: 'available' } as any)
          .eq('id', asUUID(currentVehicleId) as any);
        
        if (currentVehicleError) {
          console.error('Error updating current vehicle:', currentVehicleError);
          throw currentVehicleError;
        }
      }
      
      // Get the lease to preserve all other fields
      const { data: leaseData, error: leaseError } = await supabase
        .from('leases')
        .select('*')
        .eq('id', asUUID(leaseId) as any)
        .single();
      
      if (leaseError) {
        console.error('Error fetching lease:', leaseError);
        throw leaseError;
      }
      
      // Update the lease with the new vehicle
      const { error: updateLeaseError } = await supabase
        .from('leases')
        .update({ 
          vehicle_id: selectedVehicleId 
        } as any)
        .eq('id', asUUID(leaseId) as any);
      
      if (updateLeaseError) {
        console.error('Error updating lease:', updateLeaseError);
        throw updateLeaseError;
      }
      
      // Update the new vehicle's status to rented
      const { error: newVehicleError } = await supabase
        .from('vehicles')
        .update({ 
          status: 'rented'
        } as any)
        .eq('id', asUUID(selectedVehicleId) as any);
      
      if (newVehicleError) {
        console.error('Error updating new vehicle:', newVehicleError);
        throw newVehicleError;
      }
      
      toast({
        title: "Vehicle Assigned",
        description: "The vehicle has been successfully assigned to this agreement",
      });
      
      if (onAssignmentComplete) {
        onAssignmentComplete();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error during vehicle assignment:', error);
      toast({
        title: "Assignment Failed",
        description: "There was an issue assigning the vehicle. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!isSubmitting && !open) {
        onOpenChange(false);
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Vehicle</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-500 mb-4">
            Select a vehicle to assign to this agreement. Only available vehicles are shown.
          </p>
          
          <VehicleSelector 
            onVehicleSelect={setSelectedVehicleId}
            statusFilter="available"
            excludeVehicleId={currentVehicleId}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleVehicleAssignment} disabled={!selectedVehicleId || isSubmitting}>
            {isSubmitting ? "Assigning..." : "Assign Vehicle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
