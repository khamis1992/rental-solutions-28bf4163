
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from 'sonner';

interface VehicleInfo {
  id: string;
  make: string;
  model: string;
  license_plate: string;
  year: number;
  color: string | null;
}

interface VehicleAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  agreementId: string | null;
  onAssign: () => void;
}

const VehicleAssignmentDialog = ({ open, onClose, agreementId, onAssign }: VehicleAssignmentDialogProps) => {
  const [availableVehicles, setAvailableVehicles] = useState<VehicleInfo[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState<VehicleInfo | null>(null);
  
  // Load available vehicles when dialog opens
  useEffect(() => {
    if (open && agreementId) {
      fetchAvailableVehicles();
    } else {
      // Reset state when dialog closes
      setSelectedVehicle('');
      setVehicleDetails(null);
    }
  }, [open, agreementId]);
  
  // Load vehicle details when selection changes
  useEffect(() => {
    if (selectedVehicle) {
      fetchVehicleDetails();
    } else {
      setVehicleDetails(null);
    }
  }, [selectedVehicle]);
  
  const fetchAvailableVehicles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, make, model, license_plate, year, color')
        .eq('status', 'available')
        .order('make', { ascending: true });
        
      if (error) throw error;
      
      if (data) {
        setAvailableVehicles(data as VehicleInfo[]);
      } else {
        setAvailableVehicles([]);
      }
    } catch (error) {
      console.error('Error fetching available vehicles:', error);
      toast.error('Failed to load available vehicles');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchVehicleDetails = async () => {
    if (!selectedVehicle) return;
    
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, make, model, license_plate, year, color')
        .eq('id', selectedVehicle)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setVehicleDetails(data as VehicleInfo);
      }
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
    }
  };
  
  const handleAssign = async () => {
    if (!agreementId || !selectedVehicle) return;
    
    setIsSubmitting(true);
    try {
      // Update the agreement with the selected vehicle
      const { error } = await supabase
        .from('leases')
        .update({ 
          vehicle_id: selectedVehicle,
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', agreementId);
        
      if (error) throw error;
      
      // Update the vehicle status
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({ status: 'rented' })
        .eq('id', selectedVehicle);
        
      if (vehicleError) {
        console.error('Error updating vehicle status:', vehicleError);
        // Continue since the main operation succeeded
      }
      
      toast.success('Vehicle assigned successfully');
      onAssign();
      onClose();
    } catch (error) {
      console.error('Error assigning vehicle:', error);
      toast.error('Failed to assign vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Vehicle</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="vehicle-select">Select Available Vehicle</Label>
            <Select 
              value={selectedVehicle}
              onValueChange={setSelectedVehicle}
              disabled={isLoading || availableVehicles.length === 0}
            >
              <SelectTrigger id="vehicle-select">
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {availableVehicles.map(vehicle => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} - {vehicle.license_plate}
                  </SelectItem>
                ))}
                {availableVehicles.length === 0 && (
                  <SelectItem value="none" disabled>No available vehicles</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          {vehicleDetails && (
            <div className="border rounded-md p-3 bg-muted/30">
              <h3 className="font-medium mb-2">Vehicle Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Make:</span> {vehicleDetails.make}
                </div>
                <div>
                  <span className="text-muted-foreground">Model:</span> {vehicleDetails.model}
                </div>
                <div>
                  <span className="text-muted-foreground">License Plate:</span> {vehicleDetails.license_plate}
                </div>
                <div>
                  <span className="text-muted-foreground">Year:</span> {vehicleDetails.year}
                </div>
                {vehicleDetails.color && (
                  <div>
                    <span className="text-muted-foreground">Color:</span> {vehicleDetails.color}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={!selectedVehicle || isSubmitting}
            className="ml-2"
          >
            {isSubmitting ? 'Assigning...' : 'Assign Vehicle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleAssignmentDialog;
