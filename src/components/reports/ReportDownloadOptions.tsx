
import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export interface ReportDownloadOptionsProps {
  fileName?: string;
  agreementsData?: any[];
  finesData?: any[];
}

const ReportDownloadOptions: React.FC<ReportDownloadOptionsProps> = ({ 
  fileName = 'report', 
  agreementsData, 
  finesData 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async (reportType: string) => {
    setIsLoading(true);
    try {
      switch (reportType) {
        case 'agreements':
          if (!agreementsData || agreementsData.length === 0) {
            toast.error('No agreement data available to download');
            return;
          }

          try {
            const doc = new jsPDF();
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('Agreement Report', 14, 20);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

            // Define table headers
            const headers = ["Agreement #", "Customer", "Vehicle", "Start Date", "End Date", "Total Amount", "Status"];

            // Prepare table data
            const data = agreementsData.map(agreement => [
              agreement.agreement_number || 'N/A',
              agreement.customers?.full_name || 'N/A',
              `${agreement.vehicles?.make || 'N/A'} ${agreement.vehicles?.model || 'N/A'}`,
              agreement.start_date ? new Date(agreement.start_date).toLocaleDateString() : 'N/A',
              agreement.end_date ? new Date(agreement.end_date).toLocaleDateString() : 'N/A',
              `$${agreement.total_amount?.toFixed(2) || '0.00'}`,
              agreement.status || 'N/A'
            ]);

            // Calculate column widths
            const columnWidths = [30, 40, 40, 25, 25, 30, 25];
            let xPos = 14;
            let yPos = 50;

            // Add headers to the document
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            headers.forEach((header, index) => {
              doc.text(header, xPos, yPos);
              xPos += columnWidths[index];
            });

            // Reset x position and move y position for data rows
            xPos = 14;
            yPos += 10;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            // Add data rows to the document
            data.forEach(row => {
              row.forEach((cell, index) => {
                doc.text(cell, xPos, yPos);
                xPos += columnWidths[index];
              });

              // Reset x position and move y position for next row
              xPos = 14;
              yPos += 10;

              // Check if we need a new page
              if (yPos > 270) {
                doc.addPage();

                // Reset y position for new page
                yPos = 50;

                // Add headers to the new page
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                xPos = 14;
                headers.forEach((header, index) => {
                  doc.text(header, xPos, yPos);
                  xPos += columnWidths[index];
                });

                // Reset x position and move y position for data rows
                xPos = 14;
                yPos += 10;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
              }
            });

            doc.save('agreement-report.pdf');
            toast.success('Agreement report downloaded successfully');
          } catch (error) {
            console.error('Error generating agreement report:', error);
            toast.error('Error generating agreement report');
          }
          break;

              case 'traffic':
                try {
                  // Group traffic fines by customer
                  const finesByCustomer: Record<string, { customerName: string, fines: any[] }> = {};
                  const unassignedFines: any[] = [];
                  
                  // Organize fines by customer
                  finesData.forEach((fine: any) => {
                    if (fine.lease_id && fine.lease?.customers) {
                      const customerId = fine.lease.customer_id;
                      const customerName = fine.lease.customers.full_name || 'Unknown Customer';
                      
                      if (!finesByCustomer[customerId]) {
                        finesByCustomer[customerId] = {
                          customerName,
                          fines: []
                        };
                      }
                      
                      finesByCustomer[customerId].fines.push(fine);
                    } else {
                      unassignedFines.push(fine);
                    }
                  });
                  
                  // Create PDF document
                  const doc = new jsPDF();
                  
                  // Set up the document
                  doc.setFontSize(18);
                  doc.setFont('helvetica', 'bold');
                  doc.text('Traffic Fine Report', 14, 20);
                  doc.setFontSize(10);
                  doc.setFont('helvetica', 'normal');
                  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
                  
                  let yPos = 40;
                  
                  // Create a dedicated section for each customer
                  let pageCounter = 1;
                  Object.entries(finesByCustomer).forEach(([customerId, data]) => {
                    const customerData = data as { customerName: string, fines: any[] };
                    
                    // Check if we need a new page
                    if (yPos > 240) {
                      doc.addPage();
                      pageCounter++;
                      yPos = 20;
                      
                      // Add header to new page
                      doc.setFontSize(12);
                      doc.setFont('helvetica', 'bold');
                      doc.text(`Traffic Fine Report (Page ${pageCounter})`, 14, yPos);
                      yPos += 15;
                    }
                    
                    // Add customer section header
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.text(`Customer: ${customerData.customerName}`, 14, yPos);
                    yPos += 10;
                    
                    // Add table headers for this customer's fines
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.text('License Plate', 14, yPos);
                    doc.text('Violation Date', 70, yPos);
                    doc.text('Fine Amount', 120, yPos);
                    doc.text('Payment Status', 160, yPos);
                    
                    yPos += 6;
                    // Add a line under headers
                    doc.line(14, yPos - 2, 196, yPos - 2);
                    
                    // Add table rows for this customer's fines
                    doc.setFont('helvetica', 'normal');
                    customerData.fines.forEach((fine) => {
                      // Check if we need a new page
                      if (yPos > 250) {
                        doc.addPage();
                        pageCounter++;
                        yPos = 20;
                        
                        // Add header to new page
                        doc.setFontSize(12);
                        doc.setFont('helvetica', 'bold');
                        doc.text(`Traffic Fine Report (Page ${pageCounter})`, 14, yPos);
                        yPos += 10;
                        
                        // Continue with customer
                        doc.text(`Customer: ${customerData.customerName} (continued)`, 14, yPos);
                        yPos += 10;
                        
                        // Add table headers again
                        doc.setFontSize(10);
                        doc.text('License Plate', 14, yPos);
                        doc.text('Violation Date', 70, yPos);
                        doc.text('Fine Amount', 120, yPos);
                        doc.text('Payment Status', 160, yPos);
                        
                        yPos += 6;
                        // Add a line under headers
                        doc.line(14, yPos - 2, 196, yPos - 2);
                        
                        // Reset to normal font for content
                        doc.setFont('helvetica', 'normal');
                      }
                      
                      // Table row content
                      doc.text(fine.license_plate || 'N/A', 14, yPos);
                      doc.text(fine.violation_date ? new Date(fine.violation_date).toLocaleDateString() : 'N/A', 70, yPos);
                      doc.text(`$${fine.fine_amount?.toFixed(2) || '0.00'}`, 120, yPos);
                      doc.text(fine.payment_status || 'Pending', 160, yPos);
                      
                      yPos += 8;
                    });
                    
                    // Add spacing after each customer's section
                    yPos += 10;
                  });
                  
                  // Add unassigned fines section if any
                  if (unassignedFines.length > 0) {
                    // Check if we need a new page
                    if (yPos > 220) {
                      doc.addPage();
                      pageCounter++;
                      yPos = 20;
                      
                      // Add title to new page
                      doc.setFontSize(12);
                      doc.setFont('helvetica', 'bold');
                      doc.text(`Traffic Fine Report (Page ${pageCounter})`, 14, yPos);
                      yPos += 10;
                    }
                    
                    // Add unassigned fines section header
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Unassigned Fines:', 14, yPos);
                    yPos += 10;
                    
                    // Add table headers
                    doc.setFontSize(10);
                    doc.text('License Plate', 14, yPos);
                    doc.text('Violation Date', 70, yPos);
                    doc.text('Fine Amount', 120, yPos);
                    doc.text('Payment Status', 160, yPos);
                    
                    yPos += 6;
                    // Add a line under headers
                    doc.line(14, yPos - 2, 196, yPos - 2);
                    
                    // Add table rows for unassigned fines
                    doc.setFont('helvetica', 'normal');
                    unassignedFines.forEach((fine) => {
                      // Check if we need a new page
                      if (yPos > 250) {
                        doc.addPage();
                        pageCounter++;
                        yPos = 20;
                        
                        // Add header to new page
                        doc.setFontSize(12);
                        doc.setFont('helvetica', 'bold');
                        doc.text(`Traffic Fine Report (Page ${pageCounter})`, 14, yPos);
                        yPos += 10;
                        
                        doc.text('Unassigned Fines (continued):', 14, yPos);
                        yPos += 10;
                        
                        // Add table headers again
                        doc.setFontSize(10);
                        doc.text('License Plate', 14, yPos);
                        doc.text('Violation Date', 70, yPos);
                        doc.text('Fine Amount', 120, yPos);
                        doc.text('Payment Status', 160, yPos);
                        
                        yPos += 6;
                        // Add a line under headers
                        doc.line(14, yPos - 2, 196, yPos - 2);
                        
                        // Reset to normal font for content
                        doc.setFont('helvetica', 'normal');
                      }
                      
                      // Table row content
                      doc.text(fine.license_plate || 'N/A', 14, yPos);
                      doc.text(fine.violation_date ? new Date(fine.violation_date).toLocaleDateString() : 'N/A', 70, yPos);
                      doc.text(`$${fine.fine_amount?.toFixed(2) || '0.00'}`, 120, yPos);
                      doc.text(fine.payment_status || 'Pending', 160, yPos);
                      
                      yPos += 8;
                    });
                  }
                  
                  // Save PDF
                  doc.save('traffic-fine-report.pdf');
                  toast.success('Traffic fine report downloaded successfully');
                } catch (error) {
                  console.error('Error generating traffic fine report:', error);
                  toast.error('Error generating traffic fine report');
                }
                break;

        default:
          toast.error('Invalid report type');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isLoading}>
          <Download className="mr-2 h-4 w-4" />
          Download Report
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <DropdownMenuLabel>Select Report Type</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleDownload('agreements')}>
          Agreements Report
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload('traffic')}>
          Traffic Fine Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ReportDownloadOptions;
