import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVehicles } from '@/hooks/use-vehicles';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ReassignmentWizardProps {
  agreement: any;
  onClose: () => void;
  onReassignmentComplete: (updatedAgreement: any) => void;
}

export function ReassignmentWizard({ agreement, onClose, onReassignmentComplete }: ReassignmentWizardProps) {
  const [open, setOpen] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { vehicles, isLoading } = useVehicles({ status: 'available' });

  const handleReassign = async () => {
    if (!selectedVehicle) return;
    
    try {
      setIsSubmitting(true);
      
      // Update the lease with the new vehicle ID
      const { error } = await supabase
        .from('leases')
        .update({ vehicle_id: selectedVehicle })
        .eq('id', agreement.id);
        
      if (error) throw error;
      
      // Fetch the updated agreement to get customer info
      const { data: updatedAgreement } = await supabase
        .from('leases')
        .select(`
          *,
          profiles:customer_id (id, full_name, email, phone_number)
        `)
        .eq('id', agreement.id)
        .single();
        
      if (!updatedAgreement) throw new Error("Failed to fetch updated agreement");
      
      // Update old vehicle status to available
      const { error: oldVehicleError } = await supabase
        .from('vehicles')
        .update({ status: 'available' })
        .eq('id', agreement.vehicle_id);
        
      if (oldVehicleError) console.error("Error updating old vehicle:", oldVehicleError);
      
      // Update new vehicle status to rented
      const { error: newVehicleError } = await supabase
        .from('vehicles')
        .update({ status: 'rented' })
        .eq('id', selectedVehicle);
        
      if (newVehicleError) console.error("Error updating new vehicle:", newVehicleError);
      
      toast.success(`Vehicle reassigned successfully`);
      
      if (updatedAgreement && updatedAgreement.profiles) {
        // Use type assertion to avoid spreader error
        onReassignmentComplete({
          ...updatedAgreement,
          customer_name: updatedAgreement.profiles.full_name
        });
      } else {
        onReassignmentComplete(updatedAgreement);
      }
      
      onClose();
    } catch (error) {
      console.error("Error reassigning vehicle:", error);
      toast.error("Failed to reassign vehicle");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reassign Vehicle</AlertDialogTitle>
          <AlertDialogDescription>
            Select a new vehicle to reassign to this agreement.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="vehicle" className="text-right">
              New Vehicle
            </Label>
            <Select onValueChange={setSelectedVehicle} defaultValue={selectedVehicle} disabled={isLoading}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Loading vehicles...
                  </SelectItem>
                ) : vehicles ? (
                  vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-vehicles" disabled>
                    No vehicles available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleReassign} disabled={isSubmitting || !selectedVehicle}>
            {isSubmitting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Reassigning...
              </>
            ) : (
              "Reassign Vehicle"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
