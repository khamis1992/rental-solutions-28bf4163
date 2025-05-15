
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Vehicle } from '@/types/vehicle';
import { asVehicleId } from '@/types/database-common';
import { handleSupabaseResponse } from '@/types/database-types';

interface VehicleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId?: string;
  onAssignmentComplete?: () => void;
}

const VehicleAssignmentDialog: React.FC<VehicleAssignmentDialogProps> = ({
  open,
  onOpenChange,
  agreementId,
  onAssignmentComplete
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);

  // Fetch available vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      setIsLoading(true);
      
      try {
        const response = await supabase
          .from('vehicles')
          .select('*')
          .eq('status', 'available');

        const data = handleSupabaseResponse(response);
        
        if (data) {
          setVehicles(data as Vehicle[]);
        } else {
          setVehicles([]);
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        toast({ title: "Error", description: "Failed to fetch available vehicles" });
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchVehicles();
      
      // Get customer ID for the agreement
      if (agreementId) {
        const getCustomerId = async () => {
          try {
            const response = await supabase
              .from('leases')
              .select('customer_id')
              .eq('id', agreementId)
              .single();
              
            const data = handleSupabaseResponse(response);
            
            if (data && data.customer_id) {
              setCustomerId(data.customer_id);
            }
          } catch (error) {
            console.error('Error fetching customer ID:', error);
          }
        };
        
        getCustomerId();
      }
    }
  }, [open, agreementId]);

  const handleAssignVehicle = async () => {
    if (!selectedVehicleId || !agreementId) return;
    
    setIsSubmitting(true);
    
    try {
      // Update the lease with the selected vehicle
      const updateLeaseResponse = await supabase
        .from('leases')
        .update({ 
          vehicle_id: asVehicleId(selectedVehicleId) 
        })
        .eq('id', agreementId);
      
      if (updateLeaseResponse.error) {
        throw new Error(updateLeaseResponse.error.message);
      }
      
      // Update the vehicle status to 'rented'
      const updateVehicleResponse = await supabase
        .from('vehicles')
        .update({ status: 'rented' })
        .eq('id', selectedVehicleId);
        
      if (updateVehicleResponse.error) {
        throw new Error(updateVehicleResponse.error.message);
      }
      
      toast({ title: "Success", description: "Vehicle assigned successfully" });
      onOpenChange(false);
      if (onAssignmentComplete) onAssignmentComplete();
      
    } catch (error) {
      console.error('Error assigning vehicle:', error);
      toast({ title: "Error", description: "Failed to assign vehicle" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Assign Vehicle to Agreement</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No available vehicles found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Select a vehicle to assign</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className={`p-4 border rounded-md cursor-pointer transition-all ${
                        selectedVehicleId === vehicle.id ? 'border-primary ring-2 ring-primary ring-opacity-50' : ''
                      }`}
                      onClick={() => setSelectedVehicleId(vehicle.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {vehicle.make} {vehicle.model} ({vehicle.year})
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Plate: {vehicle.license_plate}
                          </p>
                        </div>
                        <Badge>{vehicle.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssignVehicle}
                  disabled={!selectedVehicleId || isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Assign Vehicle
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleAssignmentDialog;
