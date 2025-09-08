// @ts-nocheck
import { Agreement } from "@/types/agreement";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import { usePaymentSync } from "@/hooks/payment/use-payment-sync";
import { useState } from "react";
import { AlertCircle, CheckCircle2, RefreshCw, RotateCw } from "lucide-react";
import { Badge } from "../ui/badge";
import { usePaymentManagement } from "@/hooks/payment/use-payment-management";
import { usePaymentScheduleManagement } from "@/hooks/payment/use-payment-schedule-management";
import { Separator } from "../ui/separator";
import { paymentSyncService } from "@/services/PaymentSyncService";
import { toast } from "sonner";

interface PaymentDebugPanelProps {
  agreement: Agreement;
  isOpen: boolean;
}

export function PaymentDebugPanel({ agreement, isOpen }: PaymentDebugPanelProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Get payment data
  const { payments, isLoading: paymentsLoading } = usePaymentManagement(agreement.id);
  
  // Get payment schedule data
  const { paymentSchedule, isLoading: scheduleLoading } = usePaymentScheduleManagement(agreement.id);
  
  // Get payment sync utilities
  const { 
    fixDuplicatePayments, 
    generateMissingPayments,
    syncPaymentSchedule,
    isPending
  } = usePaymentSync();
  
  // Function to run full sync
  const runFullSync = async () => {
    setIsSyncing(true);
    try {
      toast.info("Running comprehensive payment synchronization...");
      await paymentSyncService.fixAgreementPaymentSync(agreement.id);
      toast.success("Synchronization completed");
    } catch (error) {
      toast.error("Synchronization failed");
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Function to fix duplicate payments
  const fixDuplicates = async () => {
    try {
      await fixDuplicatePayments.mutateAsync(agreement.id);
    } catch (error) {
      console.error("Error fixing duplicates:", error);
    }
  };
  
  // Function to generate missing payments
  const generateMissing = async () => {
    try {
      await generateMissingPayments.mutateAsync(agreement.id);
    } catch (error) {
      console.error("Error generating missing payments:", error);
    }
  };
  
  // Function to sync payment schedule
  const syncSchedule = async () => {
    try {
      await syncPaymentSchedule.mutateAsync(agreement.id);
    } catch (error) {
      console.error("Error syncing schedule:", error);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <Card className="border-dashed border-yellow-300 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-yellow-800 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Payment Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Developer Tools</AlertTitle>
          <AlertDescription>
            This panel is for debugging payment synchronization issues.
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Payment Info */}
          <div>
            <h4 className="font-medium mb-2">Payment Records</h4>
            {paymentsLoading ? (
              <Badge variant="outline" className="animate-pulse">Loading...</Badge>
            ) : (
              <Badge>{payments.length} payment(s)</Badge>
            )}
            <div className="mt-2 text-xs text-muted-foreground">
              {payments.length > 0 && (
                <div>
                  {payments.filter(p => p.status === 'paid' || p.status === 'completed').length} paid, {' '}
                  {payments.filter(p => p.status === 'pending').length} pending, {' '}
                  {payments.filter(p => p.status === 'overdue').length} overdue
                </div>
              )}
            </div>
          </div>
          
          {/* Schedule Info */}
          <div>
            <h4 className="font-medium mb-2">Schedule Records</h4>
            {scheduleLoading ? (
              <Badge variant="outline" className="animate-pulse">Loading...</Badge>
            ) : (
              <Badge>{paymentSchedule.length} schedule item(s)</Badge>
            )}
            <div className="mt-2 text-xs text-muted-foreground">
              {paymentSchedule.length > 0 && (
                <div>
                  {paymentSchedule.filter(p => p.status === 'completed').length} completed, {' '}
                  {paymentSchedule.filter(p => p.status === 'pending').length} pending, {' '}
                  {paymentSchedule.filter(p => p.status === 'partial').length} partial
                </div>
              )}
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Summary Statistics */}
        <div>
          <h4 className="font-medium mb-2">Summary Statistics</h4>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-green-50 p-2 rounded">
              <div className="font-medium">Total Paid</div>
              <div className="text-green-600">
                {payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount_paid || 0), 0).toFixed(2)} QAR
              </div>
            </div>
            <div className="bg-yellow-50 p-2 rounded">
              <div className="font-medium">Pending</div>
              <div className="text-yellow-600">
                {payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)} QAR
              </div>
            </div>
            <div className="bg-red-50 p-2 rounded">
              <div className="font-medium">Late</div>
              <div className="text-red-600">
                {payments.filter(p => p.days_overdue && p.days_overdue > 0).reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)} QAR
              </div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Debug Actions */}
        <div>
          <h4 className="font-medium mb-2">Debug Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fixDuplicates}
              disabled={isPending.fixDuplicates}
            >
              {isPending.fixDuplicates ? (
                <RotateCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              )}
              Fix Duplicates
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateMissing}
              disabled={isPending.generateMissing}
            >
              {isPending.generateMissing ? (
                <RotateCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Generate Missing
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={syncSchedule}
              disabled={isPending.syncSchedule}
            >
              {isPending.syncSchedule ? (
                <RotateCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Sync Schedule
            </Button>
            
            <Button 
              variant="default" 
              size="sm" 
              onClick={runFullSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <RotateCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Full Sync
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}