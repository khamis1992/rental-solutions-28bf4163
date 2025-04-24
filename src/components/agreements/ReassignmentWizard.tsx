
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, ArrowRight, CheckCircle2, Info, X, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from '@/integrations/supabase/client';
import { VehicleStatusBadge } from './VehicleStatusBadge';
import { recordVehicleReassignment, transferObligations } from '@/utils/reassignment-utils';
import { toast } from 'sonner';
import { 
  asLeaseId, 
  asVehicleId, 
  asLeaseIdColumn, 
  asStatusColumn,
  safelyExtractData,
  safelyAccessProfiles,
  safeAccess,
  safeDatabaseOperation,
  awaitableQuery
} from '@/utils/database-type-helpers';

interface AgreementSummary {
  id: string;
  agreement_number: string;
  start_date: string;
  end_date: string;
  customer_id: string;
  customer_name?: string;
  vehicle_id: string;
  status: string;
  profiles?: {
    full_name?: string;
  };
}

interface PaymentsSummary {
  pending: number;
  overdue: number;
  total_amount: number;
}

interface ReassignmentWizardProps {
  open: boolean;
  onClose: () => void;
  sourceAgreementId: string;
  targetAgreementId: string;
  vehicleId: string;
  onComplete: () => void;
}

export function ReassignmentWizard({
  open,
  onClose,
  sourceAgreementId,
  targetAgreementId,
  vehicleId,
  onComplete
}: ReassignmentWizardProps) {
  const [currentStep, setCurrentStep] = useState<string>('review');
  const [sourceAgreement, setSourceAgreement] = useState<AgreementSummary | null>(null);
  const [targetAgreement, setTargetAgreement] = useState<AgreementSummary | null>(null);
  const [vehicleDetails, setVehicleDetails] = useState<any>(null);
  const [paymentsSummary, setPaymentsSummary] = useState<PaymentsSummary>({ 
    pending: 0, 
    overdue: 0, 
    total_amount: 0 
  });
  const [transferPayments, setTransferPayments] = useState(false);
  const [reason, setReason] = useState('Vehicle reassigned to new agreement');
  const [generateDocs, setGenerateDocs] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmation, setConfirmation] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    } else {
      resetState();
    }
  }, [open, sourceAgreementId, targetAgreementId, vehicleId]);

  const resetState = () => {
    setCurrentStep('review');
    setSourceAgreement(null);
    setTargetAgreement(null);
    setVehicleDetails(null);
    setPaymentsSummary({ pending: 0, overdue: 0, total_amount: 0 });
    setTransferPayments(false);
    setReason('Vehicle reassigned to new agreement');
    setGenerateDocs(false);
    setIsLoading(true);
    setIsProcessing(false);
    setConfirmation(false);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load source agreement details
      const sourceResponse = await awaitableQuery(
        supabase
          .from('leases')
          .select(`
            id, 
            agreement_number, 
            start_date, 
            end_date, 
            status, 
            customer_id, 
            vehicle_id,
            profiles:customer_id (full_name)
          `)
          .eq('id', sourceAgreementId)
          .single()
      );
      
      if (sourceResponse) {
        const sourceData = sourceResponse as any;
        const customerName = sourceData.profiles?.full_name;
        
        const processedSourceData: AgreementSummary = {
          id: sourceData.id || '',
          agreement_number: sourceData.agreement_number || '',
          start_date: sourceData.start_date || '',
          end_date: sourceData.end_date || '',
          status: sourceData.status || '',
          customer_id: sourceData.customer_id || '',
          vehicle_id: sourceData.vehicle_id || '',
          customer_name: customerName
        };
        
        setSourceAgreement(processedSourceData);
      }
      
      // Load target agreement details
      const targetResponse = await awaitableQuery(
        supabase
          .from('leases')
          .select(`
            id, 
            agreement_number, 
            start_date, 
            end_date, 
            status, 
            customer_id, 
            vehicle_id,
            profiles:customer_id (full_name)
          `)
          .eq('id', targetAgreementId)
          .single()
      );
      
      if (targetResponse) {
        const targetData = targetResponse as any;
        const customerName = targetData.profiles?.full_name;
        
        const processedTargetData: AgreementSummary = {
          id: targetData.id || '',
          agreement_number: targetData.agreement_number || '',
          start_date: targetData.start_date || '',
          end_date: targetData.end_date || '',
          status: targetData.status || '',
          customer_id: targetData.customer_id || '',
          vehicle_id: targetData.vehicle_id || '',
          customer_name: customerName
        };
        
        setTargetAgreement(processedTargetData);
      }
      
      // Load vehicle details
      const vehicleResponse = await awaitableQuery(
        supabase
          .from('vehicles')
          .select('*')
          .eq('id', vehicleId)
          .single()
      );
      
      setVehicleDetails(vehicleResponse);
      
      // Get payment summary
      const paymentsResponse = await awaitableQuery(
        supabase
          .from('unified_payments')
          .select('id, status, amount')
          .eq('lease_id', sourceAgreementId)
          .in('status', ['pending', 'overdue'])
      );
        
      if (paymentsResponse && Array.isArray(paymentsResponse)) {
        const payments = paymentsResponse;
        const pendingCount = payments.filter(p => p?.status === 'pending').length;
        const overdueCount = payments.filter(p => p?.status === 'overdue').length;
        const totalAmount = payments.reduce((sum, p) => sum + (p?.amount || 0), 0);
        
        setPaymentsSummary({
          pending: pendingCount,
          overdue: overdueCount,
          total_amount: totalAmount
        });
      }
    } catch (error) {
      console.error("Error in loadData:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (currentStep === 'review') {
      setCurrentStep('options');
    } else if (currentStep === 'options') {
      setCurrentStep('confirm');
    }
  };

  const handleBack = () => {
    if (currentStep === 'confirm') {
      setCurrentStep('options');
    } else if (currentStep === 'options') {
      setCurrentStep('review');
    }
  };

  const handleSubmit = async () => {
    if (!confirmation) return;
    
    setIsProcessing(true);
    try {
      // 1. Close the source agreement
      const closeAgreementUpdate = {
        status: asStatusColumn('leases', 'status', 'closed'),
        updated_at: new Date().toISOString(),
        notes: reason || `Agreement closed when vehicle was reassigned to agreement ${targetAgreement?.agreement_number}`
      };
      
      const { error: closeError } = await supabase
        .from('leases')
        .update(closeAgreementUpdate)
        .eq('id', sourceAgreementId);
        
      if (closeError) {
        console.error("Error closing source agreement:", closeError);
        toast.error("Failed to close original agreement");
        return;
      }
      
      // 2. Assign vehicle to target agreement
      const assignVehicleUpdate = {
        vehicle_id: vehicleId,
        status: asStatusColumn('leases', 'status', 'active'),
        updated_at: new Date().toISOString()
      };
      
      const { error: assignError } = await supabase
        .from('leases')
        .update(assignVehicleUpdate)
        .eq('id', targetAgreementId);
        
      if (assignError) {
        console.error("Error assigning vehicle to target agreement:", assignError);
        toast.error("Failed to assign vehicle to new agreement");
        return;
      }
      
      // 3. Record the vehicle reassignment
      await recordVehicleReassignment({
        sourceAgreementId,
        sourceAgreementNumber: sourceAgreement?.agreement_number || '',
        targetAgreementId,
        targetAgreementNumber: targetAgreement?.agreement_number || '',
        vehicleId,
        reason,
        transferObligations: transferPayments
      });
      
      // 4. Transfer payments if requested
      if (transferPayments) {
        await transferObligations(sourceAgreementId, targetAgreementId);
      }
      
      // 5. Generate documents if requested
      if (generateDocs) {
        toast.info("Document generation feature will be implemented in a future update");
      }
      
      toast.success("Vehicle successfully reassigned");
      onComplete();
      onClose();
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error("An error occurred during reassignment");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!open) return null;
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="bg-slate-50 p-4 rounded-md">
        <h3 className="text-sm font-medium mb-3">Vehicle Information</h3>
        {isLoading ? (
          <div className="h-20 animate-pulse bg-slate-200 rounded-md"></div>
        ) : vehicleDetails ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-500">Make & Model:</span> 
              <span className="font-medium ml-1">{vehicleDetails.make} {vehicleDetails.model}</span>
            </div>
            <div>
              <span className="text-slate-500">Year:</span> 
              <span className="font-medium ml-1">{vehicleDetails.year}</span>
            </div>
            <div>
              <span className="text-slate-500">License Plate:</span> 
              <span className="font-medium ml-1">{vehicleDetails.license_plate}</span>
            </div>
            <div>
              <span className="text-slate-500">Status:</span> 
              <span className="ml-1">
                <VehicleStatusBadge status="assigned" size="sm" />
              </span>
            </div>
          </div>
        ) : (
          <div className="text-sm text-red-500">Failed to load vehicle details</div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-md p-4">
          <h3 className="text-sm font-medium mb-3 flex items-center">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-500 text-xs mr-2">FROM</span>
            Current Agreement
          </h3>
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-5 animate-pulse bg-slate-200 rounded-md"></div>
              <div className="h-5 animate-pulse bg-slate-200 rounded-md"></div>
              <div className="h-5 animate-pulse bg-slate-200 rounded-md"></div>
            </div>
          ) : sourceAgreement ? (
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-500">Agreement #:</span> 
                <span className="font-medium ml-1">{sourceAgreement.agreement_number}</span>
              </div>
              <div>
                <span className="text-slate-500">Customer:</span> 
                <span className="font-medium ml-1">{sourceAgreement.customer_name}</span>
              </div>
              <div>
                <span className="text-slate-500">Period:</span> 
                <span className="ml-1">{formatDate(sourceAgreement.start_date)} - {formatDate(sourceAgreement.end_date)}</span>
              </div>
              <div>
                <span className="text-slate-500">Status:</span> 
                <span className="font-medium text-red-500 ml-1">Will be CLOSED</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-red-500">Failed to load agreement</div>
 


        </div>
        </div>
        
        <div className="border rounded-md p-4">
          <h3 className="text-sm font-medium mb-3 flex items-center">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-500 text-xs mr-2">TO</span>
            New Agreement
          </h3>
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-5 animate-pulse bg-slate-200 rounded-md"></div>
              <div className="h-5 animate-pulse bg-slate-200 rounded-md"></div>
              <div className="h-5 animate-pulse bg-slate-200 rounded-md"></div>
            </div>
          ) : targetAgreement ? (
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-500">Agreement #:</span> 
                <span className="font-medium ml-1">{targetAgreement.agreement_number}</span>
              </div>
              <div>
                <span className="text-slate-500">Customer:</span> 
                <span className="font-medium ml-1">{targetAgreement.customer_name}</span>
              </div>
              <div>
                <span className="text-slate-500">Period:</span> 
                <span className="ml-1">{formatDate(targetAgreement.start_date)} - {formatDate(targetAgreement.end_date)}</span>
              </div>
              <div>
                <span className="text-slate-500">Status:</span> 
                <span className="font-medium text-green-500 ml-1">Will be ACTIVE</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-red-500">Failed to load agreement</div>
          )}
        </div>
      </div>
      
      <div className={`rounded-md border p-4 ${paymentsSummary.pending + paymentsSummary.overdue > 0 ? 'bg-amber-50 border-amber-200' : ''}`}>
        <h3 className="text-sm font-medium mb-3 flex items-center">
          <span className="mr-2 text-amber-500"><AlertCircle className="h-5 w-5" /></span>
          Outstanding Obligations
        </h3>
        {isLoading ? (
          <div className="h-5 animate-pulse bg-slate-200 rounded-md"></div>
        ) : (
          <div className="space-y-2 text-sm">
            {paymentsSummary.pending > 0 && (
              <div>
                <span className="text-slate-600">Pending Payments:</span> 
                <span className="font-medium text-amber-600 ml-1">{paymentsSummary.pending}</span>
              </div>
            )}
            {paymentsSummary.overdue > 0 && (
              <div>
                <span className="text-slate-600">Overdue Payments:</span> 
                <span className="font-medium text-red-600 ml-1">{paymentsSummary.overdue}</span>
              </div>
            )}
            {paymentsSummary.total_amount > 0 && (
              <div className="pt-2 border-t mt-2">
                <span className="text-slate-800 font-medium">Total Outstanding Amount:</span> 
                <span className="font-bold text-red-600 ml-1">QAR {paymentsSummary.total_amount.toFixed(2)}</span>
              </div>
            )}
            {paymentsSummary.pending + paymentsSummary.overdue === 0 && (
              <div className="text-green-600">No outstanding payments</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
  
  const renderOptionsStep = () => (
    <div className="space-y-6">
      <div className="border rounded-md p-4">
        <h3 className="text-sm font-medium mb-3">Reassignment Options</h3>
        
        {paymentsSummary.pending + paymentsSummary.overdue > 0 && (
          <div className="flex items-start space-x-2 mb-4 pb-4 border-b">
            <Checkbox
              id="transferPayments"
              checked={transferPayments}
              onCheckedChange={(checked) => setTransferPayments(checked as boolean)}
            />
            <div>
              <Label htmlFor="transferPayments" className="font-medium">
                Transfer Outstanding Obligations
              </Label>
              <p className="text-sm text-muted-foreground">
                Transfer all pending and overdue payments to the new agreement
              </p>
            </div>
          </div>
        )}
        
        <div className="flex items-start space-x-2 mb-4">
          <Checkbox
            id="generateDocs"
            checked={generateDocs}
            onCheckedChange={(checked) => setGenerateDocs(checked as boolean)}
          />
          <div>
            <Label htmlFor="generateDocs" className="font-medium">
              Generate Documentation
            </Label>
            <p className="text-sm text-muted-foreground">
              Generate a PDF document recording the vehicle reassignment
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="reason">Reason for Reassignment</Label>
          <Textarea
            id="reason"
            placeholder="Enter the reason for this vehicle reassignment"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            This will be recorded in the system and included in documentation
          </p>
        </div>
      </div>
    </div>
  );
  
  const renderConfirmStep = () => (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-md">
        <h3 className="text-sm font-medium mb-3 flex items-center text-amber-800">
          <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
          Confirm Vehicle Reassignment
        </h3>
        <p className="text-sm text-amber-800">
          You are about to reassign a vehicle from one agreement to another. This action will:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-amber-800 list-disc pl-5">
          <li>Close the original agreement with {sourceAgreement?.customer_name}</li>
          <li>Assign the vehicle to a new agreement with {targetAgreement?.customer_name}</li>
          {transferPayments && paymentsSummary.total_amount > 0 && (
            <li>Transfer outstanding payment obligations totaling QAR {paymentsSummary.total_amount.toFixed(2)}</li>
          )}
          {generateDocs && (
            <li>Generate documentation for the reassignment</li>
          )}
        </ul>
      </div>
      
      <div className="border rounded-md p-4">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="confirmation"
            checked={confirmation}
            onCheckedChange={(checked) => setConfirmation(checked as boolean)}
          />
          <div>
            <Label htmlFor="confirmation" className="font-medium">
              I confirm this vehicle reassignment
            </Label>
            <p className="text-sm text-muted-foreground">
              I understand that this action will close one agreement and modify another
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Reassign Vehicle</DialogTitle>
          <DialogDescription>
            Transfer a vehicle from one agreement to another.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={currentStep} className="mt-4">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="review" disabled={currentStep !== 'review'}>
              Review
            </TabsTrigger>
            <TabsTrigger value="options" disabled={currentStep !== 'options'}>
              Options
            </TabsTrigger>
            <TabsTrigger value="confirm" disabled={currentStep !== 'confirm'}>
              Confirm
            </TabsTrigger>
          </TabsList>
          <TabsContent value="review" className="py-4">
            {renderReviewStep()}
          </TabsContent>
          <TabsContent value="options" className="py-4">
            {renderOptionsStep()}
          </TabsContent>
          <TabsContent value="confirm" className="py-4">
            {renderConfirmStep()}
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex items-center justify-between">
          {currentStep === 'review' ? (
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          ) : (
            <Button variant="outline" onClick={handleBack}>Back</Button>
          )}
          
          {currentStep === 'confirm' ? (
            <Button 
              onClick={handleSubmit} 
              disabled={!confirmation || isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Processing...' : 'Complete Reassignment'}
            </Button>
          ) : (
            <Button onClick={handleContinue} className="flex items-center">
              Continue <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
