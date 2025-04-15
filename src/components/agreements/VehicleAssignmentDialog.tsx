import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  asLeaseIdColumn, 
  asStatusColumn,
  asVehicleId,
  hasData
} from '@/utils/database-type-helpers';
import { Input } from "@/components/ui/input";
import { VehicleStatus } from '@/lib/validation-schemas/vehicle';

interface VehicleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId: string;
  currentVehicleId?: string | null;
  onVehicleAssigned: () => void;
}

interface VehicleInfo {
  id: string;
  make: string;
  model: string;
  licensePlate: string;
  year: number;
  color: string | null;
}

export function VehicleAssignmentDialog({
  open,
  onOpenChange,
  agreementId,
  currentVehicleId,
  onVehicleAssigned
}: VehicleAssignmentDialogProps) {
  const [vehicleId, setVehicleId] = useState<string>(currentVehicleId || '');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    if (currentVehicleId) {
      setVehicleId(currentVehicleId);
    }
  }, [currentVehicleId]);

  const fetchVehicleDetails = async (vehicleId: string) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, make, model, license_plate, year, color')
        .eq('id', vehicleId)
        .single();

      if (error) {
        console.error("Error fetching vehicle details:", error);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error("Error fetching vehicle details:", err);
      return null;
    }
  };

  useEffect(() => {
    const loadInitialVehicle = async () => {
      if (vehicleId) {
        setIsLoading(true);
        try {
          const initialVehicle = await fetchVehicleDetails(vehicleId);
          if (initialVehicle) {
            setSelectedVehicle({
              id: initialVehicle.id,
              make: initialVehicle.make,
              model: initialVehicle.model,
              licensePlate: initialVehicle.license_plate,
              year: initialVehicle.year,
              color: initialVehicle.color
            });
          }
        } catch (error) {
          console.error("Error loading initial vehicle:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadInitialVehicle();
  }, [vehicleId]);

  const handleSelectVehicle = async (id: string) => {
    setIsLoading(true);
    try {
      const vehicleData = await fetchVehicleDetails(id);
      
      if (vehicleData) {
        setSelectedVehicle({
          id: vehicleData.id,
          make: vehicleData.make,
          model: vehicleData.model,
          licensePlate: vehicleData.license_plate,
          year: vehicleData.year,
          color: vehicleData.color
        });
      }
    } catch (error) {
      console.error("Error selecting vehicle:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignVehicle = async () => {
    setIsLoading(true);
    try {
      if (!selectedVehicle) {
        toast({
          title: "Error",
          description: "Please select a vehicle to assign.",
          variant: "destructive",
        });
        return;
      }

      // Step 1: Update the vehicle record with the new lease_id and status
      const { error: vehicleUpdateError } = await supabase
        .from('vehicles')
        .update({ status: VehicleStatus.RENTED })
        .eq('id', selectedVehicle.id);

      if (vehicleUpdateError) {
        console.error("Error updating vehicle:", vehicleUpdateError);
        toast({
          title: "Error",
          description: "Failed to update vehicle status.",
          variant: "destructive",
        });
        return;
      }

      // Step 2: Update the agreement with the selected vehicle's ID
      const { error: agreementUpdateError } = await supabase
        .from('leases')
        .update({ vehicle_id: selectedVehicle.id })
        .eq('id', agreementId);

      if (agreementUpdateError) {
        console.error("Error updating agreement:", agreementUpdateError);
        toast({
          title: "Error",
          description: "Failed to update agreement with vehicle.",
          variant: "destructive",
        });
        return;
      }

      // Step 3: Update all payments associated with the agreement to 'active' status
      const { error: paymentsUpdateError } = await supabase
        .from('unified_payments')
        .update({ status: 'active' })
        .eq('lease_id', agreementId);

      if (paymentsUpdateError) {
        console.error("Error updating payments:", paymentsUpdateError);
        toast({
          title: "Warning",
          description: "Failed to update payments status, but vehicle was assigned.",
          variant: "destructive",
        });
      }

      toast({
        title: "Success",
        description: "Vehicle assigned successfully!",
      });
      onVehicleAssigned();
      onOpenChange(false);
    } catch (error) {
      console.error("Error assigning vehicle:", error);
      toast({
        title: "Error",
        description: "Failed to assign vehicle.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Vehicle</DialogTitle>
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
          {selectedVehicle ? (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Vehicle Info</Label>
              <div className="col-span-3">
                <p>Make: {selectedVehicle.make}</p>
                <p>Model: {selectedVehicle.model}</p>
                <p>License Plate: {selectedVehicle.licensePlate}</p>
                <p>Year: {selectedVehicle.year}</p>
                <p>Color: {selectedVehicle.color}</p>
              </div>
            </div>
          ) : (
            vehicleId && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right"></Label>
                <div className="col-span-3">
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading Vehicle...
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => handleSelectVehicle(vehicleId)}>
                      Load Vehicle
                    </Button>
                  )}
                </div>
              </div>
            )
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssignVehicle} disabled={isLoading || !selectedVehicle}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign Vehicle"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
