
import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Printer, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Agreement } from "@/lib/validation-schemas/agreement";
import { Payment } from "./PaymentHistory";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface InvoiceGeneratorProps {
  agreement: Agreement;
}

export const InvoiceGenerator: React.FC<InvoiceGeneratorProps> = ({ agreement }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  // Calculate the invoice date and due date
  const invoiceDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14); // Due in 14 days
  
  // Calculate the total amount paid
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balanceDue = agreement.total_amount - totalPaid;
  
  // Fetch payments when dialog opens
  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('unified_payments')
        .select('*')
        .eq('lease_id', agreement.id)
        .order('payment_date', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payment history for invoice");
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (isOpen) {
      fetchPayments();
    }
  }, [isOpen, agreement.id]);
  
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Pop-up blocked. Please allow pop-ups for this site.");
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${agreement.agreement_number}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #333;
              margin: 0;
              padding: 20px;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .invoice-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .company-details {
              text-align: right;
            }
            .invoice-title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
              color: #2563eb;
            }
            .invoice-details {
              margin-bottom: 30px;
              border: 1px solid #e5e7eb;
              padding: 15px;
              border-radius: 5px;
            }
            .invoice-details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              margin-top: 20px;
              margin-bottom: 10px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 10px;
              text-align: left;
            }
            th {
              background-color: #f9fafb;
              font-weight: bold;
            }
            .amount-due {
              font-size: 18px;
              font-weight: bold;
              text-align: right;
              margin-top: 20px;
            }
            .footer {
              margin-top: 50px;
              font-size: 12px;
              text-align: center;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
            .text-success {
              color: #10b981;
            }
            .text-danger {
              color: #ef4444;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">
              <div>
                <div class="invoice-title">INVOICE</div>
                <div>Qatar Car Rental Service</div>
              </div>
              <div class="company-details">
                <div>Qatar Car Rental</div>
                <div>123 Doha Street</div>
                <div>Doha, Qatar</div>
                <div>info@qatarcarrental.com</div>
                <div>+974 123 4567</div>
              </div>
            </div>
            
            <div class="invoice-details">
              <div class="invoice-details-grid">
                <div>
                  <div><strong>Invoice To:</strong></div>
                  <div>${agreement.customers?.full_name || 'N/A'}</div>
                  <div>${agreement.customers?.email || 'N/A'}</div>
                  <div>${agreement.customers?.phone || 'N/A'}</div>
                </div>
                <div>
                  <div><strong>Invoice Number:</strong> INV-${agreement.agreement_number}</div>
                  <div><strong>Agreement Number:</strong> ${agreement.agreement_number}</div>
                  <div><strong>Invoice Date:</strong> ${format(invoiceDate, 'MMM dd, yyyy')}</div>
                  <div><strong>Due Date:</strong> ${format(dueDate, 'MMM dd, yyyy')}</div>
                </div>
              </div>
            </div>
            
            <div class="section-title">Rental Details</div>
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Period</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    Vehicle Rental: ${agreement.vehicles?.make || 'N/A'} ${agreement.vehicles?.model || 'N/A'} 
                    (${agreement.vehicles?.license_plate || 'N/A'})
                  </td>
                  <td>
                    ${format(new Date(agreement.start_date), "MMM dd, yyyy")} - 
                    ${format(new Date(agreement.end_date), "MMM dd, yyyy")}
                  </td>
                  <td>${formatCurrency(agreement.total_amount)}</td>
                </tr>
                ${agreement.deposit_amount ? `
                <tr>
                  <td>Security Deposit</td>
                  <td>Refundable</td>
                  <td>${formatCurrency(agreement.deposit_amount)}</td>
                </tr>` : ''}
              </tbody>
            </table>
            
            <div class="section-title">Payment History</div>
            ${payments.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Method</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${payments.map(payment => `
                <tr>
                  <td>${format(new Date(payment.payment_date), "MMM dd, yyyy")}</td>
                  <td>${payment.reference_number || '-'}</td>
                  <td>${payment.payment_method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                  <td>${formatCurrency(payment.amount)}</td>
                </tr>
                `).join('')}
              </tbody>
            </table>
            ` : '<p>No payments recorded yet.</p>'}
            
            <div class="amount-due">
              <div><strong>Total Amount:</strong> ${formatCurrency(agreement.total_amount)}</div>
              <div><strong>Total Paid:</strong> ${formatCurrency(totalPaid)}</div>
              <div style="margin-top: 10px; font-size: 20px;" class="${balanceDue <= 0 ? 'text-success' : 'text-danger'}">
                <strong>${balanceDue <= 0 ? 'PAID IN FULL' : 'BALANCE DUE:'}</strong> 
                ${balanceDue <= 0 ? '' : formatCurrency(balanceDue)}
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for choosing Qatar Car Rental. We appreciate your business!</p>
              <p>This invoice was generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for resources to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
  
  const handleDownload = () => {
    // Use html2canvas and jsPDF if needed for more advanced PDF generation
    // For simplicity, we'll just trigger the print dialog which can save as PDF
    handlePrint();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Generate Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Invoice</DialogTitle>
          <DialogDescription>
            Invoice for agreement {agreement.agreement_number}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            <div ref={invoiceRef} className="bg-white p-8 max-h-[70vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-primary mb-1">INVOICE</h1>
                  <p>Qatar Car Rental Service</p>
                </div>
                <div className="text-right">
                  <div className="font-bold">Qatar Car Rental</div>
                  <div>123 Doha Street</div>
                  <div>Doha, Qatar</div>
                  <div>info@qatarcarrental.com</div>
                  <div>+974 123 4567</div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 mb-8 grid grid-cols-2 gap-4">
                <div>
                  <div className="font-bold mb-2">Invoice To:</div>
                  <div>{agreement.customers?.full_name || 'N/A'}</div>
                  <div>{agreement.customers?.email || 'N/A'}</div>
                  <div>{agreement.customers?.phone || 'N/A'}</div>
                </div>
                <div className="text-right">
                  <div><span className="font-bold">Invoice Number:</span> INV-{agreement.agreement_number}</div>
                  <div><span className="font-bold">Agreement Number:</span> {agreement.agreement_number}</div>
                  <div><span className="font-bold">Invoice Date:</span> {format(invoiceDate, 'MMM dd, yyyy')}</div>
                  <div><span className="font-bold">Due Date:</span> {format(dueDate, 'MMM dd, yyyy')}</div>
                </div>
              </div>
              
              <h2 className="text-xl font-bold mb-4 border-b pb-2">Rental Details</h2>
              <table className="w-full mb-8">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Description</th>
                    <th className="px-4 py-2 text-left font-medium">Period</th>
                    <th className="px-4 py-2 text-left font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-2">
                      Vehicle Rental: {agreement.vehicles?.make || 'N/A'} {agreement.vehicles?.model || 'N/A'} 
                      ({agreement.vehicles?.license_plate || 'N/A'})
                    </td>
                    <td className="px-4 py-2">
                      {format(new Date(agreement.start_date), "MMM dd, yyyy")} - 
                      {format(new Date(agreement.end_date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-4 py-2">{formatCurrency(agreement.total_amount)}</td>
                  </tr>
                  {agreement.deposit_amount ? (
                    <tr className="border-b">
                      <td className="px-4 py-2">Security Deposit</td>
                      <td className="px-4 py-2">Refundable</td>
                      <td className="px-4 py-2">{formatCurrency(agreement.deposit_amount)}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
              
              <h2 className="text-xl font-bold mb-4 border-b pb-2">Payment History</h2>
              {payments.length > 0 ? (
                <table className="w-full mb-8">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Date</th>
                      <th className="px-4 py-2 text-left font-medium">Reference</th>
                      <th className="px-4 py-2 text-left font-medium">Method</th>
                      <th className="px-4 py-2 text-left font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b">
                        <td className="px-4 py-2">{format(new Date(payment.payment_date), "MMM dd, yyyy")}</td>
                        <td className="px-4 py-2">{payment.reference_number || '-'}</td>
                        <td className="px-4 py-2">
                          {payment.payment_method
                            .split('_')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')}
                        </td>
                        <td className="px-4 py-2">{formatCurrency(payment.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted-foreground mb-8">No payments recorded yet.</p>
              )}
              
              <div className="text-right space-y-2">
                <div><span className="font-bold">Total Amount:</span> {formatCurrency(agreement.total_amount)}</div>
                <div><span className="font-bold">Total Paid:</span> {formatCurrency(totalPaid)}</div>
                <div className={`text-xl mt-4 font-bold ${balanceDue <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {balanceDue <= 0 ? 'PAID IN FULL' : `BALANCE DUE: ${formatCurrency(balanceDue)}`}
                </div>
              </div>
              
              <div className="mt-12 text-center text-sm text-muted-foreground">
                <p>Thank you for choosing Qatar Car Rental. We appreciate your business!</p>
                <p>This invoice was generated on {format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
