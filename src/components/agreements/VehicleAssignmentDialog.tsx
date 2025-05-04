
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { PaymentWarningSection } from './vehicle-assignment/PaymentWarningSection';
import { formatDate } from '@/lib/date-utils';
import { asLeaseId, asVehicleId, asPaymentStatus, asTrafficFineStatus } from '@/lib/database/type-utils';

interface VehicleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaseId?: string;
  vehicleId?: string;
  onAssign: () => void;
}

export function VehicleAssignmentDialog({
  open,
  onOpenChange,
  leaseId,
  vehicleId,
  onAssign
}: VehicleAssignmentDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [acknowledgedPayments, setAcknowledgedPayments] = useState(false);
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState<any>(null);
  const [customerDetails, setCustomerDetails] = useState<any>(null);

  useEffect(() => {
    if (open && vehicleId) {
      fetchVehicleDetails();
      fetchPendingPayments();
    }
  }, [open, vehicleId, leaseId]);

  const fetchVehicleDetails = async () => {
    if (!vehicleId) return;
    
    setLoading(true);
    
    try {
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', asVehicleId(vehicleId))
        .single();
      
      setVehicleDetails(vehicle);
      
      // If we have a lease ID, fetch pending payments
      if (leaseId) {
        const { data: payments } = await supabase
          .from('unified_payments')
          .select('*')
          .eq('lease_id', asLeaseId(leaseId))
          .eq('status', asPaymentStatus('pending'));
        
        setPendingPayments(payments || []);
        
        // Also check for unpaid traffic fines
        const { data: trafficFines } = await supabase
          .from('traffic_fines')
          .select('*')
          .eq('lease_id', asLeaseId(leaseId))
          .eq('payment_status', asTrafficFineStatus('pending'));
        
        if (trafficFines && trafficFines.length > 0) {
          // Add traffic fines to pending payments display
          // This is a simplified example - you might want to format these differently
          setPendingPayments(prev => [
            ...prev,
            ...trafficFines.map((fine: any) => ({
              id: fine.id,
              amount: fine.fine_amount,
              type: 'Traffic Fine',
              status: 'pending',
              due_date: new Date()
            }))
          ]);
        }
        
        // Get customer details for the lease
        const { data: lease } = await supabase
          .from('leases')
          .select('customer_id')
          .eq('id', asLeaseId(leaseId))
          .single();
        
        if (lease && lease.customer_id) {
          const { data: customer } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', lease.customer_id)
            .single();
          
          setCustomerDetails(customer);
        }
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch vehicle and payment details.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPayments = async () => {
    // Implementation as needed
  };

  const handleAssign = async () => {
    if (!leaseId || !vehicleId) return;
    
    setAssigning(true);
    
    try {
      // Update the lease with the new vehicle ID
      const { error } = await supabase
        .from('leases')
        .update({ vehicle_id: vehicleId })
        .eq('id', leaseId);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Vehicle successfully assigned to agreement.',
      });
      
      onAssign();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error assigning vehicle:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign vehicle.',
        variant: 'destructive'
      });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Vehicle to Agreement</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="py-8 flex justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-4">
            {vehicleDetails && (
              <div className="space-y-2 border rounded p-3 bg-slate-50">
                <h3 className="font-medium">Vehicle Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Make:</span> {vehicleDetails.make}</div>
                  <div><span className="font-medium">Model:</span> {vehicleDetails.model}</div>
                  <div><span className="font-medium">Year:</span> {vehicleDetails.year}</div>
                  <div><span className="font-medium">Plate:</span> {vehicleDetails.license_plate}</div>
                </div>
              </div>
            )}
            
            {customerDetails && (
              <div className="space-y-2 border rounded p-3">
                <h3 className="font-medium">Customer Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Name:</span> {customerDetails.full_name}</div>
                  <div><span className="font-medium">Phone:</span> {customerDetails.phone_number}</div>
                  {customerDetails.email && <div><span className="font-medium">Email:</span> {customerDetails.email}</div>}
                </div>
              </div>
            )}
            
            {pendingPayments.length > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Payment Status</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsPaymentHistoryOpen(!isPaymentHistoryOpen)}
                  >
                    {isPaymentHistoryOpen ? 'Hide Details' : 'Show Details'}
                  </Button>
                </div>
                
                <PaymentWarningSection
                  pendingPayments={pendingPayments}
                  acknowledgedPayments={acknowledgedPayments}
                  onAcknowledgePayments={setAcknowledgedPayments}
                  isPaymentHistoryOpen={isPaymentHistoryOpen}
                  formatDate={formatDate}
                />
              </>
            )}
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={pendingPayments.length > 0 && !acknowledgedPayments || assigning}
              >
                {assigning ? 'Assigning...' : 'Assign Vehicle'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
