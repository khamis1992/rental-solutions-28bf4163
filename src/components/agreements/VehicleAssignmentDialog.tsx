
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, CheckCircle, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { TrafficFine, TrafficFineStatusType } from "@/hooks/use-traffic-fines";

interface VehicleAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  vehicleId: string;
  existingAgreement?: {
    id: string;
    agreement_number: string;
  };
}

interface Payment {
  id: string;
  amount: number;
  status: string;
}

export function VehicleAssignmentDialog({
  isOpen,
  onClose,
  onConfirm,
  vehicleId,
  existingAgreement
}: VehicleAssignmentDialogProps) {
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [trafficFines, setTrafficFines] = useState<TrafficFine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acknowledgedPayments, setAcknowledgedPayments] = useState(false);
  const [acknowledgedFines, setAcknowledgedFines] = useState(false);

  useEffect(() => {
    if (isOpen && existingAgreement) {
      fetchAssociatedData();
    }
  }, [isOpen, existingAgreement]);

  const fetchAssociatedData = async () => {
    if (!existingAgreement) return;
    
    setIsLoading(true);
    try {
      // Fetch pending payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', existingAgreement.id)
        .in('status', ['pending', 'overdue']);
        
      if (paymentsError) {
        console.error("Error fetching pending payments:", paymentsError);
      } else {
        setPendingPayments(paymentsData || []);
      }
      
      // Fetch traffic fines
      const { data: finesData, error: finesError } = await supabase
        .from('traffic_fines')
        .select('*')
        .eq('lease_id', existingAgreement.id)
        .eq('payment_status', 'pending');
        
      if (finesError) {
        console.error("Error fetching traffic fines:", finesError);
      } else {
        // Transform the data to ensure payment_status is a proper TrafficFineStatusType
        const transformedFines: TrafficFine[] = (finesData || []).map(fine => ({
          id: fine.id,
          violationNumber: fine.violation_number || "",
          licensePlate: fine.license_plate || "",
          violationDate: fine.violation_date ? new Date(fine.violation_date) : new Date(),
          fineAmount: fine.fine_amount || 0,
          violationCharge: fine.violation_charge,
          paymentStatus: fine.payment_status as TrafficFineStatusType,
          location: fine.fine_location,
          vehicleId: fine.vehicle_id,
          leaseId: fine.lease_id,
          paymentDate: fine.payment_date ? new Date(fine.payment_date) : undefined
        }));
        setTrafficFines(transformedFines);
      }
    } catch (error) {
      console.error("Error fetching associated data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if we need acknowledgments for payments or fines
  const needsPaymentAcknowledgment = pendingPayments.length > 0;
  const needsFinesAcknowledgment = trafficFines.length > 0;
  
  // Can proceed if no acknowledgments needed, or all are acknowledged
  const canProceed = (!needsPaymentAcknowledgment || acknowledgedPayments) && 
                    (!needsFinesAcknowledgment || acknowledgedFines);

  if (!isOpen || !existingAgreement) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>Vehicle Already Assigned</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm">
            This vehicle is currently assigned to Agreement <strong>#{existingAgreement.agreement_number}</strong>.
          </p>
          <p className="text-sm mt-2">
            If you proceed, the existing agreement will be closed automatically, and the vehicle will be assigned to your new agreement.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        ) : (
          <>
            {pendingPayments.length > 0 && (
              <div className="mt-2 border rounded-md p-3 bg-amber-50">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-medium">Pending Payments</h3>
                </div>
                <p className="text-sm mt-1 text-gray-600">
                  There {pendingPayments.length === 1 ? 'is' : 'are'} {pendingPayments.length} pending {pendingPayments.length === 1 ? 'payment' : 'payments'} associated with this agreement.
                </p>
                <div className="mt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acknowledgedPayments}
                      onChange={() => setAcknowledgedPayments(!acknowledgedPayments)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">I acknowledge the pending payments</span>
                  </label>
                </div>
              </div>
            )}

            {trafficFines.length > 0 && (
              <div className="mt-2 border rounded-md p-3 bg-amber-50">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-medium">Outstanding Traffic Fines</h3>
                </div>
                <p className="text-sm mt-1 text-gray-600">
                  There {trafficFines.length === 1 ? 'is' : 'are'} {trafficFines.length} unpaid traffic {trafficFines.length === 1 ? 'fine' : 'fines'} associated with this vehicle.
                </p>
                <div className="mt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acknowledgedFines}
                      onChange={() => setAcknowledgedFines(!acknowledgedFines)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">I acknowledge the outstanding traffic fines</span>
                  </label>
                </div>
              </div>
            )}
          </>
        )}

        <Separator />
        
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isLoading || !canProceed}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Close Old Agreement & Reassign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
