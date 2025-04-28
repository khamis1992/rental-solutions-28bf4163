import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, ArrowRight, CheckCircle2, Info, X, AlertTriangle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { VehicleStatusBadge } from './VehicleStatusBadge';
import { recordVehicleReassignment, transferObligations } from '@/utils/reassignment-utils';
import { toast } from 'sonner';
import { 
  asLeaseId, 
  asVehicleId, 
  castAgreementStatus, 
  castPaymentStatus
} from '@/lib/database';

interface AgreementSummary {
  id: string;
  agreement_number: string;
  start_date: string;
  end_date: string;
  customer_id: string;
  customer_name?: string;
  vehicle_id: string;
  status: string;
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
      const { data: sourceData, error: sourceError } = await supabase
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
        .single();
        
      if (sourceError) {
        console.error("Error loading source agreement:", sourceError);
        return;
      }
      
      let sourceDataWithCustomerName = null;
      if (sourceData) {
        sourceDataWithCustomerName = {
          ...sourceData,
          customer_name: sourceData?.profiles?.full_name
        };
      }
      
      setSourceAgreement(sourceDataWithCustomerName);
      
      // Load target agreement details
      const { data: targetData, error: targetError } = await supabase
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
        .single();
        
      if (targetError) {
        console.error("Error loading target agreement:", targetError);
        return;
      }
      
      let targetDataWithCustomerName = null;
      if (targetData) {
        targetDataWithCustomerName = {
          ...targetData,
          customer_name: targetData?.profiles?.full_name
        };
      }
      
      setTargetAgreement(targetDataWithCustomerName);
      
      // Load vehicle details
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();
        
      if (vehicleError) {
        console.error("Error loading vehicle details:", vehicleError);
        return;
      }
      
      setVehicleDetails(vehicleData);
      
      // Get payment summary
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('unified_payments')
        .select('id, status, amount')
        .eq('lease_id', sourceAgreementId)
        .in('status', ['pending', 'overdue']);
        
      if (!paymentsError && paymentsData) {
        const payments = paymentsData || [];
        const pendingCount = Array.isArray(payments) ? 
          payments.filter(p => p.status === 'pending').length : 0;
        const overdueCount = Array.isArray(payments) ? 
          payments.filter(p => p.status === 'overdue').length : 0;
        const totalAmount = Array.isArray(payments) ? 
          payments.reduce((sum, p) => sum + (p.amount || 0), 0) : 0;
        
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
      const { error: closeError } = await supabase
        .from('leases')
        .update({ 
          status: castAgreementStatus('closed'), 
          updated_at: new Date().toISOString(),
          notes: reason || `Agreement closed when vehicle was reassigned to agreement ${targetAgreement?.agreement_number}`
        })
        .eq('id', sourceAgreementId);
        
      if (closeError) {
        console.error("Error closing source agreement:", closeError);
        toast.error("Failed to close original agreement");
        return;
      }
      
      // 2. Assign vehicle to target agreement
      const { error: assignError } = await supabase
        .from('leases')
        .update({ 
          vehicle_id: vehicleId,
          status: castAgreementStatus('active'),
          updated_at: new Date().toISOString()
        })
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
          )}
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
                <span className="font-medium text-green-500 ml-1">Will become ACTIVE</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-red-500">Failed to load agreement</div>
          )}
        </div>
      </div>
      
      {/* Financial Impact */}
      {(paymentsSummary.pending > 0 || paymentsSummary.overdue > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-amber-800">Financial Impact</h3>
              <p className="text-sm text-amber-700 mt-1">
                The current agreement has {paymentsSummary.pending + paymentsSummary.overdue} pending financial obligations
                totaling {paymentsSummary.total_amount.toFixed(2)} QAR.
              </p>
              <p className="text-sm text-amber-700 mt-1">
                In the next step, you'll decide how to handle these obligations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  const renderOptionsStep = () => (
    <div className="space-y-6">
      {/* Options for handling payments */}
      {(paymentsSummary.pending > 0 || paymentsSummary.overdue > 0) && (
        <div className="border rounded-md p-4">
          <h3 className="text-sm font-medium mb-3">Payment Handling</h3>
          <div className="flex items-top space-x-2 mb-4">
            <Checkbox 
              id="transfer-payments" 
              checked={transferPayments}
              onCheckedChange={(checked) => setTransferPayments(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="transfer-payments">
                Transfer {paymentsSummary.pending + paymentsSummary.overdue} payment(s) to new agreement
              </Label>
              <p className="text-sm text-muted-foreground">
                All pending and overdue payments will be transferred to the new agreement.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Document generation */}
      <div className="border rounded-md p-4">
        <h3 className="text-sm font-medium mb-3">Documentation</h3>
        <div className="flex items-top space-x-2">
          <Checkbox 
            id="generate-docs" 
            checked={generateDocs}
            onCheckedChange={(checked) => setGenerateDocs(checked as boolean)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="generate-docs">
              Generate transition documents
            </Label>
            <p className="text-sm text-muted-foreground">
              Create formal documentation of this vehicle transfer for record keeping.
            </p>
          </div>
        </div>
      </div>
      
      {/* Reason field */}
      <div className="border rounded-md p-4">
        <h3 className="text-sm font-medium mb-3">Reason for Reassignment</h3>
        <Textarea 
          value={reason} 
          onChange={(e) => setReason(e.target.value)}
          placeholder="Provide a reason for this vehicle reassignment"
          rows={3}
        />
      </div>
    </div>
  );
  
  const renderConfirmStep = () => (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-slate-50 p-4 rounded-md">
        <h3 className="text-sm font-medium mb-3">Reassignment Summary</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center">
            <div className="w-1/3 text-slate-500">Vehicle:</div>
            <div className="w-2/3 font-medium">
              {vehicleDetails?.make} {vehicleDetails?.model} ({vehicleDetails?.license_plate})
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-1/3 text-slate-500">From Agreement:</div>
            <div className="w-2/3 font-medium">#{sourceAgreement?.agreement_number}</div>
          </div>
          <div className="flex items-center">
            <div className="w-1/3 text-slate-500">To Agreement:</div>
            <div className="w-2/3 font-medium">#{targetAgreement?.agreement_number}</div>
          </div>
          {transferPayments && (
            <div className="flex items-center">
              <div className="w-1/3 text-slate-500">Transferring:</div>
              <div className="w-2/3">
                {paymentsSummary.pending + paymentsSummary.overdue} payment(s) totaling {paymentsSummary.total_amount.toFixed(2)} QAR
              </div>
            </div>
          )}
          {generateDocs && (
            <div className="flex items-center">
              <div className="w-1/3 text-slate-500">Documentation:</div>
              <div className="w-2/3">Generating transition documents</div>
            </div>
          )}
          <div className="flex items-start">
            <div className="w-1/3 text-slate-500">Reason:</div>
            <div className="w-2/3">{reason}</div>
          </div>
        </div>
      </div>
      
      {/* Warning */}
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Important: This action cannot be easily undone</h3>
            <p className="text-sm text-red-700 mt-1">
              The current agreement will be closed and the vehicle will be assigned to the new agreement.
              While there is a rollback feature, it is recommended to check all details carefully before proceeding.
            </p>
          </div>
        </div>
      </div>
      
      {/* Confirmation checkbox */}
      <div className="border rounded-md p-4">
        <div className="flex items-top space-x-2">
          <Checkbox 
            id="confirm" 
            checked={confirmation}
            onCheckedChange={(checked) => setConfirmation(checked as boolean)}
          />
          <Label htmlFor="confirm" className="text-sm font-medium">
            I confirm that I want to reassign this vehicle and understand the consequences
          </Label>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Vehicle Reassignment</DialogTitle>
          <DialogDescription>
            Transfer a vehicle from one agreement to another
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={currentStep} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="review" disabled>
              Review
            </TabsTrigger>
            <TabsTrigger value="options" disabled>
              Options
            </TabsTrigger>
            <TabsTrigger value="confirm" disabled>
              Confirm
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="review" className="pt-4">
            {renderReviewStep()}
          </TabsContent>
          
          <TabsContent value="options" className="pt-4">
            {renderOptionsStep()}
          </TabsContent>
          
          <TabsContent value="confirm" className="pt-4">
            {renderConfirmStep()}
          </TabsContent>
        </Tabs>
        
        <Separator />
        
        <DialogFooter className="gap-2 sm:gap-0">
          {currentStep !== 'review' && (
            <Button variant="outline" onClick={handleBack} disabled={isProcessing}>
              Back
            </Button>
          )}
          
          {currentStep !== 'confirm' ? (
            <Button onClick={handleContinue} disabled={isLoading}>
              Continue
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={!confirmation || isProcessing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isProcessing ? 'Processing...' : 'Complete Reassignment'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
