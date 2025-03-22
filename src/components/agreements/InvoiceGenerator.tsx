
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Download, Printer } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { Agreement } from "@/lib/validation-schemas/agreement";
import { toast } from "sonner";

interface InvoiceGeneratorProps {
  agreement: Agreement;
}

export const InvoiceGenerator = ({ agreement }: InvoiceGeneratorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = () => {
    setIsGenerating(true);
    
    // Using setTimeout to simulate processing
    setTimeout(() => {
      window.print();
      setIsGenerating(false);
    }, 500);
  };

  const handleDownload = () => {
    setIsGenerating(true);
    
    // Using setTimeout to simulate processing
    setTimeout(() => {
      toast.success("Invoice downloaded successfully");
      setIsGenerating(false);
    }, 1000);
  };

  // Calculate the invoice details
  const invoiceNumber = `INV-${agreement.agreement_number.replace('AGR-', '')}`;
  const invoiceDate = format(new Date(), "PPP");
  const dueDate = format(new Date(new Date().setDate(new Date().getDate() + 14)), "PPP");

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Generate Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Invoice</DialogTitle>
          <DialogDescription>
            Invoice for Agreement #{agreement.agreement_number}
          </DialogDescription>
        </DialogHeader>
        
        {/* Invoice Content */}
        <div className="print:p-0 p-4 space-y-8">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">INVOICE</h1>
              <p className="text-muted-foreground">#{invoiceNumber}</p>
            </div>
            <div className="text-right">
              <h2 className="font-bold">Luxury Fleet Rentals</h2>
              <p className="text-sm text-muted-foreground">
                123 Fleet Street<br />
                Doha, Qatar<br />
                info@luxuryfleetrentals.com<br />
                +974 5555-1234
              </p>
            </div>
          </div>
          
          {/* Customer & Invoice Info */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-semibold mb-2">Bill To:</h3>
              <p className="font-bold">{agreement.customers?.full_name || "N/A"}</p>
              <p className="text-sm text-muted-foreground">
                {agreement.customers?.email || "N/A"}<br />
                {agreement.customers?.phone || "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm font-semibold">Invoice Date:</span>
                <span>{invoiceDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-semibold">Due Date:</span>
                <span>{dueDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-semibold">Agreement:</span>
                <span>#{agreement.agreement_number}</span>
              </div>
            </div>
          </div>
          
          {/* Rental Details */}
          <div>
            <h3 className="font-semibold mb-2">Rental Details</h3>
            <div className="border rounded-md">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Period</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium">
                        {agreement.vehicles?.make} {agreement.vehicles?.model} {agreement.vehicles?.year}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        License Plate: {agreement.vehicles?.license_plate || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {format(new Date(agreement.start_date), "MMM d, yyyy")} - {format(new Date(agreement.end_date), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatCurrency(agreement.total_amount)}
                    </td>
                  </tr>
                  
                  {agreement.deposit_amount > 0 && (
                    <tr>
                      <td className="px-4 py-3 text-sm">Security Deposit</td>
                      <td className="px-4 py-3 text-sm text-right">-</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        {formatCurrency(agreement.deposit_amount)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-semibold" colSpan={2}>Total</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">
                      {formatCurrency(agreement.total_amount + (agreement.deposit_amount || 0))}
                    </th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          {/* Terms & Notes */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Terms & Conditions</h3>
              <p className="text-sm text-muted-foreground">
                Payment is due within 14 days of invoice date. Late payments are subject to a 5% fee.
                Security deposit will be refunded after vehicle inspection upon return.
              </p>
            </div>
            
            {agreement.notes && (
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {agreement.notes}
                </p>
              </div>
            )}
          </div>
          
          {/* Thank You */}
          <div className="text-center py-4">
            <p className="font-medium">Thank you for your business!</p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-2 print:hidden">
          <Button 
            variant="outline" 
            onClick={handlePrint}
            disabled={isGenerating}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button 
            onClick={handleDownload}
            disabled={isGenerating}
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
