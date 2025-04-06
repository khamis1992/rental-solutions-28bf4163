
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, CheckCircle, X, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { TrafficFine, TrafficFineStatusType } from "@/hooks/use-traffic-fines";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useTranslation as useI18nTranslation } from "react-i18next";
import { useTranslation } from "@/contexts/TranslationContext";
import { cn } from "@/lib/utils";

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
  description?: string;
  payment_date?: Date;
  due_date?: Date;
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
  
  const { t } = useI18nTranslation();
  const { direction, isRTL } = useTranslation();

  useEffect(() => {
    if (isOpen && existingAgreement) {
      fetchAssociatedData();
    }
  }, [isOpen, existingAgreement]);

  const fetchAssociatedData = async () => {
    if (!existingAgreement) return;
    
    setIsLoading(true);
    try {
      if (vehicleId) {
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('id, make, model, license_plate, year, color')
          .eq('id', vehicleId)
          .single();
          
        if (!vehicleError && vehicleData) {
          setVehicleInfo(vehicleData);
        }
      }
      
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', existingAgreement.id)
        .in('status', ['pending', 'overdue']);
        
      if (paymentsError) {
        console.error("Error fetching pending payments:", paymentsError);
      } else {
        const formattedPayments = paymentsData?.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          description: payment.description,
          payment_date: payment.payment_date ? new Date(payment.payment_date) : undefined,
          due_date: payment.due_date ? new Date(payment.due_date) : undefined
        })) || [];
        setPendingPayments(formattedPayments);
      }
      
      const { data: finesData, error: finesError } = await supabase
        .from('traffic_fines')
        .select('*')
        .eq('lease_id', existingAgreement.id)
        .eq('payment_status', 'pending');
        
      if (finesError) {
        console.error("Error fetching traffic fines:", finesError);
      } else {
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
      
      const { data: agreementData, error: agreementError } = await supabase
        .from('leases')
        .select('customer_id')
        .eq('id', existingAgreement.id)
        .single();
        
      if (!agreementError && agreementData?.customer_id) {
        const { data: customerData, error: customerError } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone_number')
          .eq('id', agreementData.customer_id)
          .single();
          
        if (!customerError && customerData) {
          setCustomerInfo(customerData);
        }
      }
    } catch (error) {
      console.error("Error fetching associated data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return t("common.notProvided");
    return new Intl.DateTimeFormat(isRTL ? 'ar-SA' : 'en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-500">{t("agreements.statuses.paid")}</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">{t("agreements.statuses.overdue")}</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500">{t("agreements.statuses.pending")}</Badge>;
      default:
        return <Badge className="bg-slate-500">{status}</Badge>;
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("sm:max-w-md", isRTL ? "rtl-mode text-right" : "")}>
        <DialogHeader>
          <div className={cn("flex items-center", isRTL ? "space-x-reverse space-x-2" : "space-x-2")}>
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>{t("agreements.vehicleAlreadyAssigned")}</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm">
            {t("agreements.vehicleAlreadyAssignedDesc1", { agreementNumber: existingAgreement.agreement_number })}
          </p>
          <p className="text-sm mt-2">
            {t("agreements.vehicleAlreadyAssignedDesc2")}
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
                    <div className={cn("flex items-center", isRTL ? "space-x-reverse space-x-2" : "space-x-2")}>
                      <Info className="h-4 w-4 text-slate-500" />
                      <h3 className="text-sm font-medium">{t("agreements.vehicleAndAgreementDetails")}</h3>
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
                      <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">{t("vehicles.vehicleInformation")}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="font-medium">{t("common.make")}:</span> {vehicleInfo.make}</div>
                        <div><span className="font-medium">{t("common.model")}:</span> {vehicleInfo.model}</div>
                        <div><span className="font-medium">{t("common.licensePlate")}:</span> {vehicleInfo.license_plate}</div>
                        {vehicleInfo.year && <div><span className="font-medium">{t("common.year")}:</span> {vehicleInfo.year}</div>}
                        {vehicleInfo.color && <div><span className="font-medium">{t("common.color")}:</span> {vehicleInfo.color}</div>}
                      </div>
                    </div>
                    
                    {customerInfo && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">{t("customers.customerDetails")}</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="font-medium">{t("common.name")}:</span> {customerInfo.full_name}</div>
                          {customerInfo.email && <div><span className="font-medium">{t("common.email")}:</span> {customerInfo.email}</div>}
                          {customerInfo.phone_number && <div><span className="font-medium">{t("common.phone")}:</span> {customerInfo.phone_number}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
            
            {pendingPayments.length > 0 && (
              <div className="border rounded-md overflow-hidden mb-3">
                <div className="bg-amber-50 p-3 border-b border-amber-200">
                  <div className="flex items-center justify-between">
                    <div className={cn("flex items-center", isRTL ? "space-x-reverse space-x-2" : "space-x-2")}>
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <h3 className="text-sm font-medium text-amber-800">{t("agreements.pendingPayments")}</h3>
                    </div>
                    <Badge variant="outline" className="text-amber-700 border-amber-300">
                      {pendingPayments.length}
                    </Badge>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm mb-3">{t("agreements.pendingPaymentsWarning")}</p>
                  
                  <div className="space-y-2">
                    {pendingPayments.slice(0, 3).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between text-sm">
                        <div>{payment.description || t("agreements.payment")}</div>
                        <div className="flex items-center gap-2">
                          <span>{payment.amount} QAR</span>
                          {getStatusBadge(payment.status)}
                        </div>
                      </div>
                    ))}
                    
                    {pendingPayments.length > 3 && (
                      <div className="text-sm italic text-center">
                        {t("agreements.andMore", { count: pendingPayments.length - 3 })}
                      </div>
                    )}
                  </div>
                  
                  {needsPaymentAcknowledgment && (
                    <div className={cn("mt-3 flex items-center", isRTL ? "flex-row-reverse" : "")}>
                      <label className={cn("flex items-center text-sm cursor-pointer", isRTL ? "flex-row-reverse" : "")}>
                        <input
                          type="checkbox"
                          checked={acknowledgedPayments}
                          onChange={(e) => setAcknowledgedPayments(e.target.checked)}
                          className={cn(isRTL ? "ml-2" : "mr-2")}
                        />
                        {t("agreements.acknowledgePendingPayments")}
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {trafficFines.length > 0 && (
              <div className="border rounded-md overflow-hidden mb-3">
                <div className="bg-amber-50 p-3 border-b border-amber-200">
                  <div className="flex items-center justify-between">
                    <div className={cn("flex items-center", isRTL ? "space-x-reverse space-x-2" : "space-x-2")}>
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <h3 className="text-sm font-medium text-amber-800">{t("customers.trafficFines")}</h3>
                    </div>
                    <Badge variant="outline" className="text-amber-700 border-amber-300">
                      {trafficFines.length}
                    </Badge>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm mb-3">{t("agreements.trafficFinesWarning")}</p>
                  
                  <div className="space-y-2">
                    {trafficFines.slice(0, 3).map((fine) => (
                      <div key={fine.id} className="flex items-center justify-between text-sm">
                        <div>{fine.violationCharge || t("agreements.trafficViolation")}</div>
                        <div className="flex items-center gap-2">
                          <span>{fine.fineAmount} QAR</span>
                          {getStatusBadge(fine.paymentStatus)}
                        </div>
                      </div>
                    ))}
                    
                    {trafficFines.length > 3 && (
                      <div className="text-sm italic text-center">
                        {t("agreements.andMore", { count: trafficFines.length - 3 })}
                      </div>
                    )}
                  </div>
                  
                  {needsFinesAcknowledgment && (
                    <div className={cn("mt-3 flex items-center", isRTL ? "flex-row-reverse" : "")}>
                      <label className={cn("flex items-center text-sm cursor-pointer", isRTL ? "flex-row-reverse" : "")}>
                        <input
                          type="checkbox"
                          checked={acknowledgedFines}
                          onChange={(e) => setAcknowledgedFines(e.target.checked)}
                          className={cn(isRTL ? "ml-2" : "mr-2")}
                        />
                        {t("agreements.acknowledgeTrafficFines")}
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="border rounded-md overflow-hidden mb-3">
              <div className="bg-slate-50 p-3 border-b border-slate-200">
                <div className={cn("flex items-center", isRTL ? "space-x-reverse space-x-2" : "space-x-2")}>
                  <Info className="h-4 w-4 text-slate-500" />
                  <h3 className="text-sm font-medium">{t("common.notes")}</h3>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm mb-3">{t("agreements.vehicleReassignmentConfirmed")}</p>
              </div>
            </div>
          </>
        )}

        <DialogFooter className={cn(isRTL ? "flex-row-reverse justify-start" : "")}>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!canProceed}
            className={canProceed ? "" : "opacity-50 cursor-not-allowed"}
          >
            {t("agreements.proceedWithAssignment")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
