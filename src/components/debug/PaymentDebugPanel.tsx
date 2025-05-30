
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePaymentScheduleManagement } from '@/hooks/payment/use-payment-schedule-management';
import { PaymentSyncButton } from '@/components/agreements/PaymentSyncButton';
import { useAgreementPaymentSync } from '@/hooks/payment/use-agreement-payment-sync';
import { Agreement } from '@/types/agreement';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, ChevronDown, ChevronUp, Calendar, Clock, CheckCircle, RotateCw } from 'lucide-react';

interface PaymentDebugPanelProps {
  agreement: Agreement;
  isOpen: boolean;
}

export function PaymentDebugPanel({ agreement, isOpen }: PaymentDebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { 
    generatePaymentSchedule, 
    isGenerating,
    isPending 
  } = usePaymentScheduleManagement(agreement.id);

  const { 
    syncAll,
    isPending: syncIsPending 
  } = useAgreementPaymentSync(agreement.id);

  // Parse dates for display and calculation
  const startDate = new Date(agreement.start_date);
  const endDate = new Date(agreement.end_date);
  
  // Create new payment schedule
  const handleGenerateSchedule = async () => {
    await generatePaymentSchedule(
      startDate,
      endDate,
      agreement.rent_amount,
      agreement.payment_frequency || 'monthly',
      agreement.rent_due_day || 1
    );
  };
  
  // Synchronize all payment data
  const handleSyncAll = async () => {
    await syncAll();
  };

  if (!isOpen) return null;

  return (
    <Card className="bg-muted/20 border-dashed">
      <CardHeader className="px-4 py-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
            Payment System Debug
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent className="px-4 py-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Frequency:</span>
                  <Badge variant="outline">{agreement.payment_frequency || 'monthly'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Day:</span>
                  <Badge variant="outline">{agreement.payment_day || 1}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rent Due Day:</span>
                  <Badge variant="outline">{agreement.rent_due_day || 1}</Badge>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date:</span>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                    <span>{format(startDate, 'PPP')}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End Date:</span>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                    <span>{format(endDate, 'PPP')}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rent Amount:</span>
                  <Badge variant="outline">${agreement.rent_amount.toFixed(2)}</Badge>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Late Fee:</span>
                  <Badge variant="outline">${agreement.daily_late_fee?.toFixed(2) || '0.00'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agreement Status:</span>
                  <Badge variant={agreement.status === 'active' ? 'success' : 'secondary'}>
                    {agreement.status}
                  </Badge>
                </div>
              </div>
            </div>

            <Alert variant="warning" className="py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Caution: These actions directly modify payment data. Use only for fixing inconsistencies.
              </AlertDescription>
            </Alert>

            <div className="flex flex-wrap gap-2">
              <Button 
                variant="secondary"
                size="sm"
                onClick={handleGenerateSchedule}
                disabled={isGenerating || isPending.generate}
                className="h-8 text-xs"
              >
                {isPending.generate ? (
                  <RotateCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                Generate Payment Schedule
              </Button>

              <Button 
                variant="secondary"
                size="sm"
                onClick={handleSyncAll}
                disabled={syncIsPending.all}
                className="h-8 text-xs"
              >
                {syncIsPending.all ? (
                  <RotateCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Clock className="h-3 w-3 mr-1" />
                )}
                Sync All Payment Data
              </Button>

              <PaymentSyncButton 
                agreementId={agreement.id} 
                variant="fix"
                className="text-xs"
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
