import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from '@/integrations/supabase/client';
import { CustomerInfo, VehicleInfo, VehicleAssignmentDialogProps, Payment, TrafficFine } from '@/types/vehicle-assignment.types';
import { CustomerDetailsSection } from "./vehicle-assignment/CustomerDetailsSection";
import { VehicleDetailsSection } from "./vehicle-assignment/VehicleDetailsSection";
import { PaymentWarningSection } from "./vehicle-assignment/PaymentWarningSection";
import { 
  handleSupabaseResponse, 
  AGREEMENT_STATUSES, 
  PAYMENT_STATUSES,
  asLeaseStatus,
  asPaymentStatus,
  castId,
  asTrafficFinePaymentStatus
} from '@/utils/supabase-helpers';

export function VehicleAssignmentDialog({
  open,
  onOpenChange,
  agreementId,
  currentVehicleId,
  onAssignVehicle
}: VehicleAssignmentDialogProps) {
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [trafficFines, setTrafficFines] = useState<TrafficFine[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [acknowledgedPayments, setAcknowledgedPayments] = useState(false);
  const [acknowledgedFines, setAcknowledgedFines] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
  const [existingAgreement, setExistingAgreement] = useState<{
    id: string;
    agreement_number: string;
  } | null>(null);

  useEffect(() => {
    if (open && currentVehicleId) {
      fetchVehicleDetails();
      fetchExistingAgreement();
    }
  }, [open, currentVehicleId]);

  const fetchExistingAgreement = async () => {
    if (!currentVehicleId) return;
    
    try {
      const activeStatus = asLeaseStatus(AGREEMENT_STATUSES.ACTIVE);
      const vehicleIdParam = castId(currentVehicleId, 'vehicles');
      
      const { data, error } = await supabase
        .from('leases')
        .select('id, agreement_number')
        .eq('vehicle_id', vehicleIdParam)
        .eq('status', activeStatus)
        .single();
      
      // Handle response safely
      const safeData = handleSupabaseResponse({ data, error });
      if (safeData) {
        setExistingAgreement({
          id: safeData.id,
          agreement_number: safeData.agreement_number
        });
        fetchAssociatedData(safeData.id);
      }
    } catch (error) {
      console.error("Error fetching existing agreement:", error);
    }
  };

  const fetchVehicleDetails = async () => {
    if (!currentVehicleId) return;
    
    setIsLoading(true);
    try {
      const vehicleIdParam = castId(currentVehicleId, 'vehicles');
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, make, model, license_plate, year, color')
        .eq('id', vehicleIdParam)
        .single();
      
      const safeData = handleSupabaseResponse({ data, error });
      if (safeData) {
        setVehicleInfo(safeData as VehicleInfo);
      }
    } catch (error) {
      console.error("Error fetching vehicle details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssociatedData = async (leaseId: string) => {
    if (!leaseId) return;
    
    setIsLoading(true);
    try {
      // Fetch pending payments
      const pendingStatus = asPaymentStatus(PAYMENT_STATUSES.PENDING);
      const overdueStatus = asPaymentStatus(PAYMENT_STATUSES.OVERDUE);
      const leaseIdParam = castId(leaseId, 'leases');
      
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', leaseIdParam)
        .in('status', [pendingStatus, overdueStatus]);
        
      const safePaymentsData = handleSupabaseResponse({ data: paymentsData, error: paymentsError });
      if (safePaymentsData) {
        // Transform data to match the Payment interface
        const typedPayments: Payment[] = safePaymentsData.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          payment_date: payment.payment_date || '',
          status: payment.status,
          description: payment.description,
          payment_method: payment.payment_method,
          days_overdue: payment.days_overdue,
          late_fine_amount: payment.late_fine_amount
        }));
        setPendingPayments(typedPayments);
      }
      
      // Fetch traffic fines
      const pendingPaymentStatus = asTrafficFinePaymentStatus('pending');
      
      const { data: finesData, error: finesError } = await supabase
        .from('traffic_fines')
        .select('*')
        .eq('lease_id', leaseIdParam)
        .eq('payment_status', pendingPaymentStatus);
        
      const safeFinesData = handleSupabaseResponse({ data: finesData, error: finesError });
      if (safeFinesData) {
        // Transform data to match the TrafficFine interface
        const typedFines: TrafficFine[] = safeFinesData.map(fine => ({
          id: fine.id,
          violation_number: fine.violation_number || '',
          fine_amount: fine.fine_amount || 0,
          payment_status: fine.payment_status,
          violation_date: fine.violation_date || ''
        }));
        setTrafficFines(typedFines);
      }
      
      // Fetch customer information through lease
      const { data: leaseData, error: leaseError } = await supabase
        .from('leases')
        .select('customer_id')
        .eq('id', leaseIdParam)
        .single();
        
      const safeLeaseData = handleSupabaseResponse({ data: leaseData, error: leaseError });
      if (safeLeaseData && safeLeaseData.customer_id) {
        const customerIdParam = castId(safeLeaseData.customer_id, 'profiles');
        
        const { data: customerData, error: customerError } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone_number, driver_license')
          .eq('id', customerIdParam)
          .single();
          
        const safeCustomerData = handleSupabaseResponse({ data: customerData, error: customerError });
        if (safeCustomerData) {
          setCustomerInfo(safeCustomerData as CustomerInfo);
        }
      }
    } catch (error) {
      console.error("Error fetching associated data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(dateObj);
  };

  // Check if we need acknowledgments
  const needsPaymentAcknowledgment = pendingPayments.length > 0;
  const needsFinesAcknowledgment = trafficFines.length > 0;
  
  // Can proceed if no acknowledgments needed, or all are acknowledged
  const canProceed = (!needsPaymentAcknowledgment || acknowledgedPayments) && 
                    (!needsFinesAcknowledgment || acknowledgedFines);

  if (!open || !existingAgreement) return null;

  const handleConfirm = async () => {
    if (currentVehicleId) {
      await onAssignVehicle(currentVehicleId);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            {/* Vehicle and Customer Information Section */}
            {vehicleInfo && (
              <Collapsible
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                className="border rounded-md overflow-hidden mb-3"
              >
                <div className="bg-slate-50 p-3">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4 text-slate-500" />
                      <h3 className="text-sm font-medium">Vehicle & Agreement Details</h3>
                    </div>
                    {isDetailsOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="p-3 bg-white">
                  <div className="space-y-4">
                    <VehicleDetailsSection vehicleInfo={vehicleInfo} isDetailsOpen={isDetailsOpen} />
                    <CustomerDetailsSection customerInfo={customerInfo} isDetailsOpen={isDetailsOpen} />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Payment History Section */}
            {pendingPayments.length > 0 && (
              <Collapsible
                open={isPaymentHistoryOpen}
                onOpenChange={setIsPaymentHistoryOpen}
                className="border rounded-md overflow-hidden mb-3"
              >
                <div className="bg-slate-50 p-3">
                  <CollapsibleTrigger className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4 text-slate-500" />
                      <h3 className="text-sm font-medium">Payment History</h3>
                    </div>
                    {isPaymentHistoryOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="p-3 bg-white">
                  <PaymentWarningSection
                    pendingPayments={pendingPayments}
                    acknowledgedPayments={acknowledgedPayments}
                    onAcknowledgePayments={setAcknowledgedPayments}
                    isPaymentHistoryOpen={isPaymentHistoryOpen}
                    formatDate={formatDate}
                  />
                </CollapsibleContent>
              </Collapsible>
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
                      onChange={(e) => setAcknowledgedFines(e.target.checked)}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
