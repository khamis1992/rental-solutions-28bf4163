
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Agreement } from '@/lib/validation-schemas/agreement';
import InvoiceGenerator from '@/components/invoices/InvoiceGenerator';
import { AgreementTabs } from '../AgreementTabs';
import { AgreementSummaryHeader } from '../AgreementSummaryHeader';
import { AgreementActions } from '../AgreementActions';
import ParticleBackground from '@/components/ui/particle-background';
import { PaymentEntryDialog } from '@/components/payments/PaymentEntryDialog';

interface AgreementDetailsLayoutProps {
  agreement: Agreement | null;
  isLoading: boolean;
  rentAmount: number | null;
  isGeneratingPayment: boolean;
  isRunningMaintenance: boolean;
  isDocumentDialogOpen: boolean;
  setIsDocumentDialogOpen: (value: boolean) => void;
  isPaymentDialogOpen: boolean;
  setIsPaymentDialogOpen: (value: boolean) => void;
  onGeneratePayment: () => void;
  onRunMaintenanceJob: () => void;
  onHandlePaymentSubmit: (
    amount: number,
    paymentDate: Date,
    notes?: string,
    paymentMethod?: string,
    referenceNumber?: string,
    includeLatePaymentFee?: boolean,
    isPartialPayment?: boolean,
    targetPaymentId?: string
  ) => void;
  navigate: (path: string) => void;
}

export function AgreementDetailsLayout({
  agreement,
  isLoading,
  rentAmount,
  isGeneratingPayment,
  isRunningMaintenance,
  isDocumentDialogOpen,
  setIsDocumentDialogOpen,
  isPaymentDialogOpen,
  setIsPaymentDialogOpen,
  onGeneratePayment,
  onRunMaintenanceJob,
  onHandlePaymentSubmit,
  navigate,
}: AgreementDetailsLayoutProps) {
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="text-center py-12">
        <div className="flex items-center justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Agreement not found</h3>
        <p className="text-muted-foreground mb-4">
          The agreement you're looking for doesn't exist or has been removed.
        </p>
        <Button variant="outline" onClick={() => navigate("/agreements")}>
          Return to Agreements
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 pointer-events-none -z-10">
        <ParticleBackground />
      </div>

      <div className="mb-6">
        <Button variant="ghost" className="gap-2" asChild>
          <a href="/agreements">
            <ChevronLeft className="h-4 w-4" /> Back to Agreements
          </a>
        </Button>
      </div>

      <AgreementSummaryHeader agreement={agreement} rentAmount={rentAmount} />
      
      <AgreementActions
        onEdit={() => {}}
        onDelete={() => {}}
        onDownloadPdf={() => {}}
        onGeneratePayment={onGeneratePayment}
        onRunMaintenance={onRunMaintenanceJob}
        onGenerateDocument={() => setIsDocumentDialogOpen(true)}
        onAddPayment={() => setIsPaymentDialogOpen(true)}
        isGeneratingPayment={isGeneratingPayment}
        isRunningMaintenance={isRunningMaintenance}
        status={agreement?.status || 'pending'}
      />

      <AgreementTabs agreement={agreement} />

      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
        <DialogContent className="max-w-4xl">
          <InvoiceGenerator 
            recordType="agreement" 
            recordId={agreement.id} 
            onClose={() => setIsDocumentDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      <PaymentEntryDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        defaultAmount={rentAmount || 0}
        onSubmit={onHandlePaymentSubmit}
      />
    </>
  );
}
