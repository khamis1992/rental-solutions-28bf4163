import React from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { generateStandardReport } from '@/utils/report-utils';

export interface ReportDownloadOptionsProps {
  reportType: string;
  getReportData: () => any[];
}

const ReportDownloadOptions: React.FC<ReportDownloadOptionsProps> = ({
  reportType,
  getReportData
}) => {
  const handleDownloadPDF = () => {
    try {
      let data = getReportData();
      if (!data || data.length === 0) {
        toast.error('No data to export');
        return;
      }
      
      // Special processing for traffic fines reports
      if (reportType === 'traffic') {
        // Clean and format data for traffic fines
        data = data.map(item => {
          // Format date fields if they exist
          if (item.violationDate && item.violationDate instanceof Date) {
            item.violationDate = formatDate(item.violationDate);
          }
          
          // Format amounts
          if (typeof item.fineAmount === 'number') {
            item.fineAmount = formatCurrency(item.fineAmount, '');
          }
          
          // Return only the fields we want for the report
          return {
            violationNumber: item.violationNumber || 'N/A',
            licensePlate: item.licensePlate || 'N/A',
            violationDate: item.violationDate || 'N/A',
            customerName: item.customerName || 'Unassigned',
            fineAmount: item.fineAmount || '0.00'
          };
        });
        
        // Generate the traffic fines report using the standard report generator
        const doc = generateStandardReport(
          'TRAFFIC FINES REPORT',
          { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() },
          (doc, startY) => {
            let y = startY;

            // Add report summary
            const totalAmount = data.reduce((sum, item) => {
              const amount = typeof item.fineAmount === 'string' 
                ? parseFloat(item.fineAmount.replace(/[^\d.-]/g, ''))
                : (item.fineAmount || 0);
              return sum + (isNaN(amount) ? 0 : amount);
            }, 0);
            
            // Add summary section
            doc.setFillColor(244, 244, 249);
            doc.rect(14, y, doc.internal.pageSize.getWidth() - 28, 25, 'F');
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(44, 62, 80);
            doc.text('Report Summary', 20, y + 8);
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(70, 70, 70);
            doc.text(`Total Fines: ${data.length}`, 20, y + 18);
            doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 140, y + 18);
            
            y += 35;
            
            // Group data by customer name
            const groupedByCustomer: Record<string, any[]> = {};
            
            data.forEach(item => {
              const customerName = item.customerName || 'Unassigned';
              if (!groupedByCustomer[customerName]) {
                groupedByCustomer[customerName] = [];
              }
              groupedByCustomer[customerName].push(item);
            });

            // Create customer sections
            Object.keys(groupedByCustomer).sort().forEach((customerName, index) => {
              const fines = groupedByCustomer[customerName];
              
              // Add a new page if needed
              if (y > 240 && index > 0) {
                doc.addPage();
                y = 30;
              }
              
              // Add a section for this customer
              doc.setFontSize(14);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(44, 62, 80);
              
              // Customer name header with background
              doc.setFillColor(52, 73, 94);
              doc.rect(14, y - 10, doc.internal.pageSize.getWidth() - 28, 12, 'F');
              doc.setTextColor(255, 255, 255);
              doc.text(customerName, 20, y - 2);
              
              y += 10;
              
              // Calculate customer total
              const customerTotal = fines.reduce((sum, item) => {
                const amount = typeof item.fineAmount === 'string' 
                  ? parseFloat(item.fineAmount.replace(/[^\d.-]/g, ''))
                  : (item.fineAmount || 0);
                return sum + (isNaN(amount) ? 0 : amount);
              }, 0);

              // Table headers
              const headers = ['Violation #', 'License Plate', 'Date', 'Amount'];
              const columnWidths = [45, 45, 35, 35];
              const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
              const startX = (doc.internal.pageSize.getWidth() - tableWidth) / 2;
              
              // Draw header background
              doc.setFillColor(240, 240, 240); // Light gray header
              doc.rect(startX, y - 5, tableWidth, 10, 'F');
              
              // Draw header text
              doc.setFontSize(10);
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(70, 70, 70); // Dark text for header
              
              let x = startX + 5; // padding
              headers.forEach((header, i) => {
                doc.text(header, x, y);
                x += columnWidths[i];
              });
              
              y += 10;
              
              // Draw table rows
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(70, 70, 70); // Dark gray text for content
              
              fines.forEach((fine, rowIndex) => {
                // Add page if needed
                if (y > 270) {
                  doc.addPage();
                  y = 30;
                  
                  // Redraw headers on new page
                  doc.setFillColor(240, 240, 240);
                  doc.rect(startX, y - 5, tableWidth, 10, 'F');
                  
                  doc.setFontSize(10);
                  doc.setFont('helvetica', 'bold');
                  doc.setTextColor(70, 70, 70);
                  
                  x = startX + 5;
                  headers.forEach((header, i) => {
                    doc.text(header, x, y - 2);
                    x += columnWidths[i];
                  });
                  
                  y += 8;
                  doc.setFont('helvetica', 'normal');
                  doc.setTextColor(70, 70, 70);
                }
                
                // Alternating row background for better readability
                if (rowIndex % 2 === 1) {
                  doc.setFillColor(248, 248, 248);
                  doc.rect(startX, y - 5, tableWidth, 10, 'F');
                }
                
                // Draw cells
                x = startX + 5;
                
                // Violation Number
                doc.text(String(fine.violationNumber).substring(0, 15), x, y);
                x += columnWidths[0];
                
                // License Plate
                doc.text(String(fine.licensePlate).substring(0, 12), x, y);
                x += columnWidths[1];
                
                // Date
                doc.text(String(fine.violationDate).substring(0, 12), x, y);
                x += columnWidths[2];
                
                // Amount
                doc.text(String(fine.fineAmount), x, y);
                
                y += 10;
              });
              
              // Add note about total
              doc.setFont('helvetica', 'bold');
              doc.text(`Total: ${formatCurrency(customerTotal)}`, startX + tableWidth - 40, y + 5);
              
              y += 20;
            });
            
            return y;
          }
        );
        
        doc.save('traffic-fines-report.pdf');
        toast.success('PDF Report downloaded successfully');
        return;
      }
      
      // For other report types, use the default generation method
      const pdf = new jsPDF();
      
      // Add company logo and header
      pdf.setFontSize(20);
      pdf.setTextColor(44, 62, 80);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${reportType.toUpperCase()} REPORT`, 105, 20, { align: 'center' });
      
      // Add subtitle with date
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      const date = formatDate(new Date());
      pdf.text(`Generated on: ${date}`, 105, 30, { align: 'center' });
      
      // Add report summary
      if (reportType === 'traffic') {
        const totalAmount = data.reduce((sum, item) => {
          const amount = typeof item.fineAmount === 'string' 
            ? parseFloat(item.fineAmount.replace(/[^\d.-]/g, ''))
            : (item.fineAmount || 0);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
        
        pdf.setFont('helvetica', 'bold');
        pdf.text('Report Summary', 20, 45);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Total Fines: ${data.length}`, 20, 55);
        pdf.text(`Total Amount: ${formatCurrency(totalAmount)}`, 20, 62);
      }
      
      // Group data by month for traffic reports
      if (reportType === 'traffic') {
        const groupedData: Record<string, any[]> = {};
        
        data.forEach(item => {
          let month = 'Unknown Date';
          
          // Try to get month from violationDate
          if (item.violationDate) {
            if (item.violationDate instanceof Date) {
              month = item.violationDate.toLocaleString('default', { month: 'long', year: 'numeric' });
            } else if (typeof item.violationDate === 'string') {
              try {
                const dateObj = new Date(item.violationDate);
                month = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
              } catch (e) {
                month = 'Unknown Date';
              }
            }
          }
          
          if (!groupedData[month]) {
            groupedData[month] = [];
          }
          groupedData[month].push(item);
        });
        
        // Start with a decent margin from the summary
        let y = 75;
        const headers = ['Violation #', 'License Plate', 'Date', 'Driver/Customer', 'Amount'];
        
        Object.entries(groupedData).forEach(([month, monthData]) => {
          // Add page if needed
          if (y > 250) {
            pdf.addPage();
            y = 20;
          }
          
          // Add month header
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(44, 62, 80);
          pdf.text(month, 20, y);
          y += 10;
          
          // Calculate column widths and positions
          const columnWidths = [40, 30, 30, 50, 30];
          const startX = 20;
          
          // Draw header row
          pdf.setFillColor(240, 240, 240);
          pdf.rect(startX, y - 5, pdf.internal.pageSize.width - 40, 7, 'F');
          
          let x = startX;
          headers.forEach((header, i) => {
            pdf.text(header, x, y);
            x += columnWidths[i];
          });
          y += 7;
          
          // Draw data rows
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          
          let monthTotal = 0;
          
          monthData.forEach((row, rowIndex) => {
            // Extract amount for monthly totals
            if (typeof row.fineAmount === 'string') {
              const numericValue = parseFloat(row.fineAmount.replace(/[^\d.-]/g, ''));
              if (!isNaN(numericValue)) {
                monthTotal += numericValue;
              }
            } else if (typeof row.fineAmount === 'number') {
              monthTotal += row.fineAmount;
            }
            
            // Add page if needed
            if (y > 270) {
              pdf.addPage();
              y = 20;
              
              // Redraw headers on new page
              pdf.setFont('helvetica', 'bold');
              pdf.setFillColor(240, 240, 240);
              pdf.rect(startX, y - 5, pdf.internal.pageSize.width - 40, 7, 'F');
              
              x = startX;
              headers.forEach((header, i) => {
                pdf.text(header, x, y);
                x += columnWidths[i];
              });
              y += 7;
              pdf.setFont('helvetica', 'normal');
            }
            
            // Alternating row background
            if (rowIndex % 2 === 1) {
              pdf.setFillColor(248, 248, 248);
              pdf.rect(startX, y - 5, pdf.internal.pageSize.width - 40, 7, 'F');
            }
            
            // Draw cells
            x = startX;
            
            // Violation Number
            pdf.text(String(row.violationNumber).substring(0, 15), x, y);
            x += columnWidths[0];
            
            // License Plate
            pdf.text(String(row.licensePlate).substring(0, 12), x, y);
            x += columnWidths[1];
            
            // Date
            pdf.text(String(row.violationDate).substring(0, 12), x, y);
            x += columnWidths[2];
            
            // Customer Name
            pdf.text(String(row.customerName).substring(0, 25), x, y);
            x += columnWidths[3];
            
            // Amount
            pdf.text(String(row.fineAmount), x, y);
            
            y += 7;
          });
          
          // Add month total
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Month Total: ${formatCurrency(monthTotal)}`, pdf.internal.pageSize.width - 60, y);
          y += 15;
        });
      } else {
        // Default table generation for other report types
        const headers = Object.keys(data[0]);
        const rows = data.map(item => Object.values(item));
        
        // Calculate column widths based on content and header names
        const columnWidths = headers.map((header, i) => {
          const headerLength = header.length;
          const maxContentLength = Math.max(...rows.map(row => String(row[i] || '').length));
          const maxLength = Math.max(headerLength, maxContentLength);
          // Adjust width factor based on column content type
          const widthFactor = header.includes('customer') ? 3.5 : 3; // Give more space to customer name columns
          return Math.min(40, Math.max(10, maxLength * widthFactor));
        });
        
        // Draw table
        let y = 35;
        
        // Draw headers
        let x = 20;
        pdf.setFont('helvetica', 'bold');
        headers.forEach((header, i) => {
          // Format header for display (convert snake_case to Title Case)
          const displayHeader = header
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
            
          const width = columnWidths[i];
          pdf.text(displayHeader, x, y);
          x += width;
          if (x > 190) {
            x = 20;
            y += 10;
          }
        });
        
        y += 8;
        
        // Draw rows
        pdf.setFont('helvetica', 'normal');
        rows.forEach((row, rowIndex) => {
          x = 20;
          row.forEach((cell, i) => {
            const width = columnWidths[i];
            // Format cell value for display
            let displayValue = String(cell || '');
            
            // Format boolean values
            if (typeof cell === 'boolean') {
              displayValue = cell ? 'Yes' : 'No';
            }
            
            // Handle long text with ellipsis if needed
            if (displayValue.length > 30 && !headers[i].includes('customer')) {
              displayValue = displayValue.substring(0, 27) + '...';
            }
            
            pdf.text(displayValue, x, y);
            x += width;
            if (x > 190) {
              x = 20;
              y += 6;
            }
          });
          y += 8;
          
          // Add new page if needed
          if (y > 280) {
            pdf.addPage();
            y = 20;
          }
        });
      }
      
      // Add footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(10);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Page ${i} of ${pageCount}`, 105, 280, { align: 'center' });
        pdf.text('CONFIDENTIAL - ALARAF CAR RENTAL', 105, 287, { align: 'center' });
      }
      
      pdf.save(`${reportType.toLowerCase()}-report.pdf`);
      toast.success('PDF Report downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF');
    }
  };
  
  const handleDownloadExcel = () => {
    try {
      let data = getReportData();
      if (!data || data.length === 0) {
        toast.error('No data to export');
        return;
      }
      
      // Special processing for traffic fines reports
      if (reportType === 'traffic') {
        data = data.map(item => {
          const { id, location, paymentStatus, customerId, ...keepFields } = item;
          return keepFields;
        });
      }
      
      // Create a workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, reportType);
      
      // Generate Excel file
      XLSX.writeFile(wb, `${reportType.toLowerCase()}-report.xlsx`);
      toast.success('Excel Report downloaded successfully');
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast.error('Error generating Excel file');
    }
  };
  
  const handleDownloadCSV = () => {
    try {
      let data = getReportData();
      if (!data || data.length === 0) {
        toast.error('No data to export');
        return;
      }
      
      // Special processing for traffic fines reports
      if (reportType === 'traffic') {
        data = data.map(item => {
          const { id, location, paymentStatus, customerId, ...keepFields } = item;
          return keepFields;
        });
      }
      
      // Convert to CSV using xlsx
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType.toLowerCase()}-report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV Report downloaded successfully');
    } catch (error) {
      console.error('Error generating CSV:', error);
      toast.error('Error generating CSV file');
    }
  };

  return (
    <div className="flex gap-2 mb-4">
      <Button variant="outline" onClick={handleDownloadPDF}>
        <Download className="mr-2 h-4 w-4" />
        Export as PDF
      </Button>
      <Button variant="outline" onClick={handleDownloadExcel}>
        <FileText className="mr-2 h-4 w-4" />
        Export as Excel
      </Button>
      <Button variant="outline" onClick={handleDownloadCSV}>
        <FileText className="mr-2 h-4 w-4" />
        Export as CSV
      </Button>
    </div>
  );
};

export default ReportDownloadOptions;
