
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, CheckCircle, X, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { TrafficFine, TrafficFineStatusType } from "@/hooks/use-traffic-fines";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  asVehicleId,
  asLeaseId,
  asLeaseIdColumn,
  asStatusColumn,
  asPaymentStatusColumn,
  hasData,
  safelyGetRecordsFromResponse
} from '@/utils/database-type-helpers';
import { Payment } from "./PaymentHistory.types";

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

interface CustomerInfo {
  id: string;
  full_name: string;
  email?: string;
  phone_number?: string;
}

interface VehicleInfo {
  id: string;
  make: string;
  model: string;
  license_plate: string;
  year?: number;
  color?: string;
}

type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export function VehicleAssignmentDialog({
  isOpen,
  onClose,
  onConfirm,
  vehicleId,
  existingAgreement
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

  useEffect(() => {
    if (isOpen && existingAgreement) {
      fetchAssociatedData();
    }
  }, [isOpen, existingAgreement]);

  const fetchAssociatedData = async () => {
    if (!existingAgreement) return;
    
    setIsLoading(true);
    try {
      // Fetch vehicle information
      if (vehicleId) {
        const vehicleResponse = await supabase
          .from('vehicles')
          .select('id, make, model, license_plate, year, color')
          .eq('id', asVehicleId(vehicleId))
          .single();
          
        if (hasData(vehicleResponse)) {
          setVehicleInfo(vehicleResponse.data as VehicleInfo);
        }
      }
      
      // Fetch pending payments
      const fetchPayments = async () => {
        try {
          const pendingStatuses = ['pending', 'overdue', 'partially_paid'];
          const { data, error } = await supabase
            .from('unified_payments')
            .select('*')
            .eq('lease_id', asLeaseIdColumn(existingAgreement.id))
            .in('status', asPaymentStatusColumn(pendingStatuses));
          
          if (error) throw error;
          
          // Safely access the data with proper typing
          const payments = safelyGetRecordsFromResponse(data);
          
          // Process payments with null checking
          const typedPayments: Payment[] = payments.map(payment => ({
            id: payment?.id || '',
            amount: payment?.amount || 0,
            status: (payment?.status as PaymentStatus) || 'pending',
            description: payment?.description || '',
            payment_date: payment?.payment_date ? new Date(payment.payment_date) : undefined,
            due_date: payment?.due_date ? new Date(payment.due_date) : undefined
          }));
          
          setPendingPayments(typedPayments);
        } catch (error) {
          console.error("Error fetching payments:", error);
          setPendingPayments([]);
        }
      };
      
      fetchPayments();
      
      // Fetch traffic fines
      const finesResponse = await supabase
        .from('traffic_fines')
        .select('*')
        .eq('lease_id', asLeaseIdColumn(existingAgreement.id))
        .eq('payment_status', asPaymentStatusColumn('pending'));
        
      if (hasData(finesResponse)) {
        // Transform the data to ensure payment_status is a proper TrafficFineStatusType
        const finesData = safelyGetRecordsFromResponse(finesResponse.data);
        const transformedFines: TrafficFine[] = finesData.map(fine => ({
          id: fine?.id || '',
          violationNumber: fine?.violation_number || "",
          licensePlate: fine?.license_plate || "",
          violationDate: fine?.violation_date ? new Date(fine.violation_date) : new Date(),
          fineAmount: fine?.fine_amount || 0,
          violationCharge: fine?.violation_charge || '',
          paymentStatus: (fine?.payment_status as TrafficFineStatusType) || 'pending',
          location: fine?.fine_location || '',
          vehicleId: fine?.vehicle_id || '',
          leaseId: fine?.lease_id || '',
          paymentDate: fine?.payment_date ? new Date(fine.payment_date) : undefined
        }));
        setTrafficFines(transformedFines);
      } else {
        console.error("Error fetching traffic fines:", finesResponse?.error);
        setTrafficFines([]);
      }
      
      // Fetch customer information
      const agreementResponse = await supabase
        .from('leases')
        .select('customer_id')
        .eq('id', asLeaseId(existingAgreement.id))
        .single();
        
      if (hasData(agreementResponse) && agreementResponse.data?.customer_id) {
        const customerResponse = await supabase
          .from('profiles')
          .select('id, full_name, email, phone_number')
          .eq('id', agreementResponse.data.customer_id)
          .single();
          
        if (hasData(customerResponse)) {
          setCustomerInfo(customerResponse.data as CustomerInfo);
        }
      }
    } catch (error) {
      console.error("Error fetching associated data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const needsPaymentAcknowledgment = pendingPayments.length > 0;
  const needsFinesAcknowledgment = trafficFines.length > 0;
  
  const canProceed = (!needsPaymentAcknowledgment || acknowledgedPayments) && 
                    (!needsFinesAcknowledgment || acknowledgedFines);

  if (!isOpen || !existingAgreement) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(dateObj);
  };

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Overdue</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500">Pending</Badge>;
      default:
        return <Badge className="bg-slate-500">{status}</Badge>;
    }
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
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Vehicle Information</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="font-medium">Make:</span> {vehicleInfo.make}</div>
                        <div><span className="font-medium">Model:</span> {vehicleInfo.model}</div>
                        <div><span className="font-medium">License Plate:</span> {vehicleInfo.license_plate}</div>
                        {vehicleInfo.year && <div><span className="font-medium">Year:</span> {vehicleInfo.year}</div>}
                        {vehicleInfo.color && <div><span className="font-medium">Color:</span> {vehicleInfo.color}</div>}
                      </div>
                    </div>
                    
                    {customerInfo && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Current Customer</h4>
                        <div className="grid grid-cols-1 gap-1 text-sm">
                          <div><span className="font-medium">Name:</span> {customerInfo.full_name}</div>
                          {customerInfo.email && <div><span className="font-medium">Email:</span> {customerInfo.email}</div>}
                          {customerInfo.phone_number && <div><span className="font-medium">Phone:</span> {customerInfo.phone_number}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

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
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Payments</h4>
                    <div className="max-h-48 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="p-2 text-left">Amount</th>
                            <th className="p-2 text-left">Status</th>
                            <th className="p-2 text-left">Due Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingPayments.map((payment) => (
                            <tr key={payment.id} className="border-b">
                              <td className="p-2">{payment.amount} QAR</td>
                              <td className="p-2">{getStatusBadge(payment.status)}</td>
                              <td className="p-2">{formatDate(payment.due_date)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

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
