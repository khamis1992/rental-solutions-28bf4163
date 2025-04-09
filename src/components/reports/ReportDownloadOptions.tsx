
import React from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

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
      const data = getReportData();
      if (!data || data.length === 0) {
        toast.error('No data to export');
        return;
      }
      
      const pdf = new jsPDF();
      pdf.setFontSize(16);
      pdf.text(`${reportType.toUpperCase()} REPORT`, 105, 15, { align: 'center' });
      pdf.setFontSize(11);
      
      // Add current date
      const date = new Date().toLocaleDateString();
      pdf.text(`Generated on: ${date}`, 20, 25);
      
      // Add data in tabular format
      const headers = Object.keys(data[0]);
      const rows = data.map(item => Object.values(item));
      
      // Calculate column widths based on content
      const columnWidths = headers.map((header, i) => {
        const maxLength = Math.max(
          header.length,
          ...rows.map(row => String(row[i] || '').length)
        );
        return Math.min(40, Math.max(10, maxLength * 3));
      });
      
      // Draw table
      let y = 35;
      
      // Draw headers
      let x = 20;
      pdf.setFont('helvetica', 'bold');
      headers.forEach((header, i) => {
        const width = columnWidths[i];
        pdf.text(header, x, y);
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
          pdf.text(String(cell || ''), x, y);
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
      
      pdf.save(`${reportType.toLowerCase()}-report.pdf`);
      toast.success('PDF Report downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF');
    }
  };
  
  const handleDownloadExcel = () => {
    try {
      const data = getReportData();
      if (!data || data.length === 0) {
        toast.error('No data to export');
        return;
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
      const data = getReportData();
      if (!data || data.length === 0) {
        toast.error('No data to export');
        return;
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
