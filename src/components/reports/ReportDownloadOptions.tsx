import React from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { generateStandardReport, addCompanyLogo, addFooterImage } from '@/utils/report-utils';

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
      
      if (reportType === 'traffic') {
        data = data.map(fine => ({
          violationNumber: fine.violationNumber || 'N/A',
          licensePlate: fine.licensePlate || 'N/A',
          violationDate: fine.violationDate ? formatDate(fine.violationDate) : 'N/A',
          customerName: fine.customerName || 'Unassigned',
          fineAmount: formatCurrency(fine.fineAmount || 0)
        }));
        
        const doc = generateStandardReport(
          'TRAFFIC FINES REPORT',
          { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() },
          (doc, startY) => {
            let y = startY;
            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();
            const marginBottom = 30; // Space to reserve for footer
            
            const totalAmount = data.reduce((sum, item) => {
              const amount = typeof item.fineAmount === 'string' ? 
                parseFloat(item.fineAmount.replace(/[^\d.-]/g, '')) : 
                (item.fineAmount || 0);
              return sum + (isNaN(amount) ? 0 : amount);
            }, 0);
            
            doc.setFillColor(240, 240, 240);
            doc.rect(15, y, pageWidth - 30, 20, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(44, 62, 80);
            doc.text(`Total Fines: ${data.length}`, 20, y + 12);
            doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, pageWidth - 40, y + 12, { align: 'right' });
            
            y += 30;
            
            const customerGroups: Record<string, any[]> = {};
            data.forEach(fine => {
              const customerName = fine.customerName || 'Unassigned';
              if (!customerGroups[customerName]) customerGroups[customerName] = [];
              customerGroups[customerName].push(fine);
            });
            
            Object.entries(customerGroups).forEach(([customerName, customerFines], groupIndex) => {
              // Check if we need a new page for this customer group
              const estimatedGroupHeight = 12 + (customerFines.length * 10) + 30;
              if (y + estimatedGroupHeight > pageHeight - marginBottom && groupIndex > 0) {
                doc.addPage();
                y = startY; // Reset Y position for the new page
              }
              
              doc.setFillColor(52, 73, 94);
              doc.rect(15, y - 8, pageWidth - 30, 12, 'F');
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(12);
              doc.text(customerName, 20, y);
              
              y += 12;
              
              const headers = ['Violation #', 'License Plate', 'Date', 'Amount'];
              const columnWidths = [50, 50, 40, 40];
              const tableStartX = 15;
              
              doc.setFillColor(240, 240, 240);
              doc.rect(tableStartX, y, pageWidth - 30, 10, 'F');
              
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(44, 62, 80);
              doc.setFontSize(10);
              
              let x = tableStartX + 5;
              headers.forEach((header, i) => {
                doc.text(header, x, y + 8);
                x += columnWidths[i];
              });
              
              y += 15;
              
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(70, 70, 70);
              
              customerFines.forEach((fine, index) => {
                // Check if we need a new page for this row
                if (y > pageHeight - marginBottom - 10) {
                  doc.addPage();
                  y = startY; // Reset Y position for the new page
                  
                  // Redraw the headers on the new page
                  doc.setFillColor(240, 240, 240);
                  doc.rect(tableStartX, y, pageWidth - 30, 10, 'F');
                  
                  doc.setFont('helvetica', 'bold');
                  doc.setTextColor(44, 62, 80);
                  doc.setFontSize(10);
                  
                  x = tableStartX + 5;
                  headers.forEach((header, i) => {
                    doc.text(header, x, y + 8);
                    x += columnWidths[i];
                  });
                  
                  y += 15;
                  doc.setFont('helvetica', 'normal');
                  doc.setTextColor(70, 70, 70);
                }
                
                x = tableStartX + 5;
                
                if (index % 2 === 1) {
                  doc.setFillColor(248, 248, 248);
                  doc.rect(tableStartX, y - 5, pageWidth - 30, 10, 'F');
                }
                
                doc.text(fine.violationNumber, x, y);
                x += columnWidths[0];
                
                doc.text(fine.licensePlate, x, y);
                x += columnWidths[1];
                
                doc.text(fine.violationDate, x, y);
                x += columnWidths[2];
                
                doc.text(fine.fineAmount, x, y);
                
                y += 10;
              });
              
              y += 10;
            });
            
            return y;
          }
        );
        
        doc.save('traffic-fines-report.pdf');
        toast.success('PDF Report downloaded successfully');
      } else {        // Handle other report types with proper pagination
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const marginBottom = 30;
        
        // Add company logo
        addCompanyLogo(pdf);
        
        pdf.setFontSize(20);
        pdf.setTextColor(44, 62, 80);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${reportType.toUpperCase()} REPORT`, 105, 20, { align: 'center' });
        
        pdf.setFontSize(12);
        pdf.setTextColor(100, 100, 100);
        pdf.setFont('helvetica', 'normal');
        const date = formatDate(new Date());
        pdf.text(`Generated on: ${date}`, 105, 30, { align: 'center' });
        
        let y = 40;
        
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
        
        if (reportType === 'traffic') {
          const groupedData: Record<string, any[]> = {};
          
          data.forEach(item => {
            let month = 'Unknown Date';
            
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
          
          const headers = ['Violation #', 'License Plate', 'Date', 'Driver/Customer', 'Amount'];
          const columnWidths = [40, 30, 30, 50, 30];
          
          Object.entries(groupedData).forEach(([month, monthData]) => {
            // Check if we need a new page for this month group
            if (y > pageHeight - marginBottom - 40) {
              pdf.addPage();
              y = 20;
            }
            
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(44, 62, 80);
            pdf.text(month, 20, y);
            y += 10;
            
            const startX = 20;
            
            pdf.setFillColor(240, 240, 240);
            pdf.rect(startX, y - 5, pdf.internal.pageSize.width - 40, 7, 'F');
            
            let x = startX;
            headers.forEach((header, i) => {
              pdf.text(header, x, y);
              x += columnWidths[i];
            });
            y += 7;
            
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            
            let monthTotal = 0;
            
            monthData.forEach((row, rowIndex) => {
              if (typeof row.fineAmount === 'string') {
                const numericValue = parseFloat(row.fineAmount.replace(/[^\d.-]/g, ''));
                if (!isNaN(numericValue)) {
                  monthTotal += numericValue;
                }
              } else if (typeof row.fineAmount === 'number') {
                monthTotal += row.fineAmount;
              }
              
              // Check if we need a new page for this row
              if (y > pageHeight - marginBottom) {
                pdf.addPage();
                y = 20;
                
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
              
              if (rowIndex % 2 === 1) {
                pdf.setFillColor(248, 248, 248);
                pdf.rect(startX, y - 5, pdf.internal.pageSize.width - 40, 7, 'F');
              }
              
              x = startX;
              
              pdf.text(String(row.violationNumber).substring(0, 15), x, y);
              x += columnWidths[0];
              
              pdf.text(String(row.licensePlate).substring(0, 12), x, y);
              x += columnWidths[1];
              
              pdf.text(String(row.violationDate).substring(0, 12), x, y);
              x += columnWidths[2];
              
              pdf.text(String(row.customerName).substring(0, 25), x, y);
              x += columnWidths[3];
              
              pdf.text(String(row.fineAmount), x, y);
              
              y += 7;
            });
            
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Month Total: ${formatCurrency(monthTotal)}`, pdf.internal.pageSize.width - 60, y);
            y += 15;
          });
        } else {
          const headers = Object.keys(data[0]);
          const rows = data.map(item => Object.values(item));
          
          // Calculate column widths based on content
          const columnWidths = headers.map((header, i) => {
            const headerLength = header.length;
            const maxContentLength = Math.max(...rows.map(row => String(row[i] || '').length));
            const maxLength = Math.max(headerLength, maxContentLength);
            const widthFactor = header.includes('customer') ? 3.5 : 3;
            return Math.min(40, Math.max(10, maxLength * widthFactor));
          });
          
          let y = 35;
          
          // Draw headers
          let x = 20;
          pdf.setFont('helvetica', 'bold');
          headers.forEach((header, i) => {
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
            // Check if we need a new page for this row
            if (y > pageHeight - marginBottom) {
              pdf.addPage();
              y = 20;
              
              // Redraw headers on new page
              x = 20;
              pdf.setFont('helvetica', 'bold');
              headers.forEach((header, i) => {
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
              pdf.setFont('helvetica', 'normal');
            }
            
            x = 20;
            row.forEach((cell, i) => {
              const width = columnWidths[i];
              let displayValue = String(cell || '');
              
              if (typeof cell === 'boolean') {
                displayValue = cell ? 'Yes' : 'No';
              }
              
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
          });
        }
          // Add page numbers and footer to each page
        const pageCount = pdf.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          pdf.setPage(i);
          
          // Add footer image
          addFooterImage(pdf);
          
          pdf.setFont('helvetica', 'italic');
          pdf.setFontSize(10);
          pdf.setTextColor(150, 150, 150);
          pdf.text(`Page ${i} of ${pageCount}`, 105, 260, { align: 'center' });
          pdf.text('CONFIDENTIAL - ALARAF CAR RENTAL', 105, 287, { align: 'center' });
        }
        
        pdf.save(`${reportType.toLowerCase()}-report.pdf`);
        toast.success('PDF Report downloaded successfully');
      }
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
      
      if (reportType === 'traffic') {
        data = data.map(item => {
          const { id, location, paymentStatus, customerId, ...keepFields } = item;
          return keepFields;
        });
      }
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      XLSX.utils.book_append_sheet(wb, ws, reportType);
      
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
      
      if (reportType === 'traffic') {
        data = data.map(item => {
          const { id, location, paymentStatus, customerId, ...keepFields } = item;
          return keepFields;
        });
      }
      
      const ws = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(ws);
      
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
