
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { generatePaymentHistoryPdf } from '@/utils/report-utils';
import { formatDate } from '@/lib/date-utils';

interface PaymentActionsBarProps {
  rentAmount: number | null;
  onRecordPaymentClick: () => void;
}

export function PaymentActionsBar({ rentAmount, onRecordPaymentClick }: PaymentActionsBarProps) {
  const handleExportHistoryClick = () => {
    try {
      // Format payment data for the PDF export - now with formatted dates (without time)
      const paymentHistoryData = [];
      
      // Generate the PDF
      const doc = generatePaymentHistoryPdf(
        paymentHistoryData,
        "Payment History"
      );

      // Save the PDF
      doc.save("payment-history.pdf");
      toast.success("Payment history exported successfully");
    } catch (error) {
      console.error("Error exporting payment history:", error);
      toast.error("Failed to export payment history");
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={onRecordPaymentClick}>
        <Plus className="mr-2 h-4 w-4" />
        Record Payment
      </Button>
      <Button variant="outline" onClick={handleExportHistoryClick}>
        <FileText className="mr-2 h-4 w-4" />
        Export History
      </Button>
    </div>
  );
}
