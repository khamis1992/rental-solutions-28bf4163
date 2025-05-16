
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, RefreshCcw } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface AgreementPageActionsProps {
  isActive: boolean;
  onGeneratePayment: () => void;
  onGenerateReport: () => void;
  onRunMaintenance: () => void;
  paymentIsPending: {
    generatePayment: boolean;
    runMaintenance: boolean;
  };
}

export function AgreementPageActions({
  isActive,
  onGeneratePayment,
  onGenerateReport,
  onRunMaintenance,
  paymentIsPending
}: AgreementPageActionsProps) {
  return (
    <>
      {isActive && (
        <HoverCard openDelay={300} closeDelay={200}>
          <HoverCardTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onGeneratePayment} 
              disabled={paymentIsPending.generatePayment} 
              className="gap-2 mr-2"
            >
              <Calendar className="h-4 w-4" />
              {paymentIsPending.generatePayment ? "Generating..." : "Generate Payment Schedule"}
            </Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-80 p-4 bg-white border shadow-lg rounded-lg">
            <h4 className="font-medium mb-1">Payment Schedule Generation</h4>
            <p className="text-sm text-muted-foreground">
              Creates a new monthly payment record for this agreement with automatically calculated due amount and late fees. 
              The payment status will be set to "pending".
            </p>
          </HoverCardContent>
        </HoverCard>
      )}
      <HoverCard openDelay={300} closeDelay={200}>
        <HoverCardTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onGenerateReport} 
            className="gap-2 mr-2"
          >
            <FileText className="h-4 w-4" />
            Generate Report
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 p-4 bg-white border shadow-lg rounded-lg">
          <h4 className="font-medium mb-1">Agreement Report</h4>
          <p className="text-sm text-muted-foreground">
            Generate a detailed PDF report of this agreement including payment history and contract details.
          </p>
        </HoverCardContent>
      </HoverCard>
      <HoverCard openDelay={300} closeDelay={200}>
        <HoverCardTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRunMaintenance} 
            disabled={paymentIsPending.runMaintenance} 
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            {paymentIsPending.runMaintenance ? "Running..." : "Run Payment Maintenance"}
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 p-4 bg-white border shadow-lg rounded-lg">
          <h4 className="font-medium mb-1">Payment Maintenance</h4>
          <p className="text-sm text-muted-foreground">
            Checks and fixes payment schedules by detecting missing or duplicate payments, 
            updating payment statuses, and recalculating late fees if needed.
          </p>
        </HoverCardContent>
      </HoverCard>
    </>
  );
}
