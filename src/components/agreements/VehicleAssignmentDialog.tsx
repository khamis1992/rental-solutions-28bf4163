
import React from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useVehicles } from '@/hooks/use-vehicles';
import { Payment } from '@/types/payment-history.types';
import { TrafficFine } from '@/types/trafficFine';

export function VehicleAssignmentDialog({
  open,
  onOpenChange,
  agreementId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId: string;
}) {
  const { toast } = useToast();
  const { vehicles, isLoading } = useVehicles();
  const [selectedVehicleId, setSelectedVehicleId] = React.useState<string>('');
  const [pendingPayments, setPendingPayments] = React.useState<Payment[]>([]);
  const [trafficFines, setTrafficFines] = React.useState<TrafficFine[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch existing vehicle association, pending payments, and traffic fines
  React.useEffect(() => {
    if (!agreementId || !open) return;

    const fetchData = async () => {
      try {
        // Get current vehicle association
        const { data: agreement } = await supabase
          .from('leases')
          .select('vehicle_id')
          .eq('id', agreementId)
          .single();

        if (agreement?.vehicle_id) {
          setSelectedVehicleId(agreement.vehicle_id);
        }

        // Get pending payments
        const { data: payments } = await supabase
          .from('unified_payments')
          .select('*')
          .eq('lease_id', agreementId)
          .in('status', ['pending', 'partially_paid']);
        
        setPendingPayments(payments as Payment[] || []);

        // Get unpaid traffic fines
        const { data: fines } = await supabase
          .from('traffic_fines')
          .select('*')
          .eq('lease_id', agreementId)
          .eq('payment_status', 'pending');
        
        setTrafficFines(fines as TrafficFine[] || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load agreement data',
          variant: 'destructive',
        });
      }
    };

    fetchData();
  }, [agreementId, open, toast]);

  // Function to assign a vehicle to the agreement
  const handleAssignVehicle = async () => {
    if (!selectedVehicleId) {
      toast({
        title: 'Error',
        description: 'Please select a vehicle',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update the agreement with the selected vehicle
      const { error } = await supabase
        .from('leases')
        .update({ vehicle_id: selectedVehicleId })
        .eq('id', agreementId);

      if (error) throw error;

      // Update the vehicle status to 'rented'
      await supabase
        .from('vehicles')
        .update({ status: 'rented' })
        .eq('id', selectedVehicleId);
      
      toast({
        title: 'Success',
        description: 'Vehicle assigned successfully',
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning vehicle:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign vehicle',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Vehicle</DialogTitle>
          <DialogDescription>
            Select a vehicle to assign to this agreement. 
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {pendingPayments.length > 0 && (
            <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
              <h4 className="text-amber-800 font-medium mb-1">Warning: Pending Payments</h4>
              <p className="text-amber-700 text-sm">
                This agreement has {pendingPayments.length} pending payment(s). Consider resolving these before reassigning.
              </p>
            </div>
          )}
          
          {trafficFines.length > 0 && (
            <div className="bg-rose-50 p-3 rounded-md border border-rose-200">
              <h4 className="text-rose-800 font-medium mb-1">Warning: Unpaid Traffic Fines</h4>
              <p className="text-rose-700 text-sm">
                This agreement has {trafficFines.length} unpaid traffic fine(s). Consider resolving these before reassigning.
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="vehicle" className="text-sm font-medium">
              Vehicle
            </label>
            <select
              id="vehicle"
              className="w-full px-3 py-2 border rounded-md"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              disabled={isLoading}
            >
              <option value="">Select a vehicle</option>
              {vehicles?.map((vehicle: any) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssignVehicle} disabled={isSubmitting || !selectedVehicleId}>
            {isSubmitting ? 'Assigning...' : 'Assign Vehicle'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
