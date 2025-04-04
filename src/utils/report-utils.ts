import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';

// Get the current language from localStorage or default to English
export const getCurrentLanguage = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('language') || 'en';
  }
  return 'en';
};

// Check if current language is RTL
export const isRTL = (): boolean => {
  const lang = getCurrentLanguage();
  return lang === 'ar';
};

// Format numbers based on locale (use Arabic numerals for Arabic)
export const formatNumber = (num: number): string => {
  if (isRTL()) {
    // Format using Arabic numerals
    return num.toLocaleString('ar-SA');
  }
  return num.toLocaleString('en-US');
};

// Format dates based on locale
export const formatDateForReport = (date: Date | string): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isRTL()) {
    // Format date for Arabic locale
    return format(dateObj, 'dd MMMM yyyy', { locale: arSA });
  }
  
  // Format date for English locale
  return format(dateObj, 'MMMM dd, yyyy');
};

// Convert string to Arabic if needed
export const localizeText = (text: string, translations: Record<string, any>): string => {
  if (!text) return '';
  
  if (isRTL() && translations) {
    // First try to find direct translation in our translation files
    const keys = text.split('.');
    let result = translations;
    
    for (const key of keys) {
      if (result && result[key]) {
        result = result[key];
      } else {
        // If not found, return original text
        return text;
      }
    }
    
    if (typeof result === 'string') {
      return result;
    }
  }
  
  return text;
};

// Function to add standard report header
export const addReportHeader = (
  doc: jsPDF, 
  title: string, 
  dateRange?: { from?: Date; to?: Date; },
  isRTL: boolean = false
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;
  
  // Set RTL mode if needed
  if (isRTL) {
    doc.setR2L(true);
  }
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, isRTL ? pageWidth - 20 : 20, yPos);
  yPos += 10;
  
  // Date range if provided
  if (dateRange && (dateRange.from || dateRange.to)) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    let dateText = 'Date: ';
    if (dateRange.from && dateRange.to) {
      dateText += `${formatDateForReport(dateRange.from)} - ${formatDateForReport(dateRange.to)}`;
    } else if (dateRange.from) {
      dateText += formatDateForReport(dateRange.from);
    } else if (dateRange.to) {
      dateText += formatDateForReport(dateRange.to);
    }
    
    doc.text(dateText, isRTL ? pageWidth - 20 : 20, yPos);
    yPos += 10;
  }
  
  // Current date
  const generatedDate = `Generated on: ${formatDateForReport(new Date())}`;
  doc.text(generatedDate, isRTL ? pageWidth - 20 : 20, yPos);
  yPos += 15;
  
  // Add a separator line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(20, yPos - 5, pageWidth - 20, yPos - 5);
  
  return yPos;
};

// Function to add standard report footer
export const addReportFooter = (doc: jsPDF, isRTL: boolean = false): void => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Add page numbers
  const totalPages = doc.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    
    const pageText = `Page ${i} of ${totalPages}`;
    doc.text(
      pageText,
      isRTL ? 20 : pageWidth - 20,
      pageHeight - 10,
      { align: isRTL ? 'left' : 'right' }
    );
    
    // Add confidentiality notice
    const confidentialText = 'CONFIDENTIAL - FOR INTERNAL USE ONLY';
    doc.text(
      confidentialText,
      isRTL ? pageWidth - 20 : 20,
      pageHeight - 10,
      { align: isRTL ? 'right' : 'left' }
    );
  }
};

// Generate PDF with RTL support
export const generatePDF = (
  reportTitle: string, 
  data: any[], 
  columns: { field: string; header: string }[],
  translations: Record<string, any>
): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Set RTL mode if needed
  if (isRTL()) {
    doc.setR2L(true);
    // Use a font that supports Arabic characters
    doc.addFont('/fonts/NotoSansArabic-Regular.ttf', 'NotoSansArabic', 'normal');
    doc.setFont('NotoSansArabic');
  }

  // Localize report title
  const localizedTitle = localizeText(reportTitle, translations);
  
  // Set up document properties
  doc.setFontSize(18);
  doc.text(localizedTitle, isRTL() ? doc.internal.pageSize.width - 20 : 20, 20);
  
  // Add date
  doc.setFontSize(10);
  const dateText = localizeText('common.generatedOn', translations) + ': ' + formatDateForReport(new Date());
  doc.text(dateText, isRTL() ? doc.internal.pageSize.width - 20 : 20, 30);
  
  // Set up table headers
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  const tableHeaders = columns.map(col => localizeText(col.header, translations));
  const tableData = data.map(row => {
    return columns.map(col => {
      const value = row[col.field];
      
      // Format different types of data
      if (value instanceof Date) {
        return formatDateForReport(value);
      } else if (typeof value === 'number') {
        return formatNumber(value);
      } else if (typeof value === 'string' && col.field.includes('amount')) {
        return formatCurrency(parseFloat(value));
      }
      
      return value?.toString() || '';
    });
  });
  
  // Create table - with RTL support if needed
  const startY = 40;
  const options = {
    head: [tableHeaders],
    body: tableData,
    startY,
    styles: {
      font: isRTL() ? 'NotoSansArabic' : 'helvetica',
      halign: isRTL() ? 'right' : 'left',
    },
    headStyles: {
      fillColor: [66, 133, 244],
      textColor: [255, 255, 255],
      halign: isRTL() ? 'right' : 'left',
    },
  };
  
  // @ts-ignore - autoTable method comes from jspdf-autotable plugin
  doc.autoTable(options);
  
  // Add confidentiality notice at bottom
  const confidentialText = localizeText('reports.confidential', translations);
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    confidentialText, 
    isRTL() ? doc.internal.pageSize.width - 20 : 20, 
    doc.internal.pageSize.height - 10
  );
  
  return doc;
};

// Export data to Excel with RTL support
export const generateExcel = (
  reportTitle: string, 
  data: any[], 
  columns: { field: string; header: string }[],
  translations: Record<string, any>
): XLSX.WorkBook => {
  // Create worksheet headers with localized text
  const headers = columns.map(col => localizeText(col.header, translations));
  
  // Process data for excel format
  const excelData = data.map(row => {
    const rowData: Record<string, any> = {};
    
    columns.forEach((col, index) => {
      const value = row[col.field];
      const header = headers[index];
      
      // Format different types of data
      if (value instanceof Date) {
        rowData[header] = formatDateForReport(value);
      } else if (typeof value === 'number') {
        rowData[header] = isRTL() ? formatNumber(value) : value;
      } else if (typeof value === 'string' && col.field.includes('amount')) {
        rowData[header] = formatCurrency(parseFloat(value));
      } else {
        rowData[header] = value;
      }
    });
    
    return rowData;
  });
  
  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(excelData, { header: headers });
  
  // Set RTL direction for Arabic
  if (isRTL()) {
    if (!worksheet['!cols']) worksheet['!cols'] = [];
    
    // Set RTL for all columns
    headers.forEach((_, i) => {
      if (!worksheet['!cols']) worksheet['!cols'] = [];
      worksheet['!cols'][i] = { ...worksheet['!cols'][i], direction: 'right-to-left' };
    });
  }
  
  // Create workbook and add the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, localizeText(reportTitle, translations));
  
  return workbook;
};

// Generate CSV with proper encoding for Arabic support
export const generateCSV = (
  data: any[], 
  columns: { field: string; header: string }[],
  translations: Record<string, any>
): string => {
  // Localize headers
  const headers = columns.map(col => localizeText(col.header, translations));
  
  // Create CSV rows with headers
  const csvRows = [headers.join(',')];
  
  // Add data rows
  for (const row of data) {
    const csvRow = columns.map(col => {
      const value = row[col.field];
      
      // Format different types of data
      if (value instanceof Date) {
        return `"${formatDateForReport(value)}"`;
      } else if (typeof value === 'number') {
        return isRTL() ? formatNumber(value) : value.toString();
      } else if (typeof value === 'string') {
        // Escape quotes in string values
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return value?.toString() || '';
    });
    
    csvRows.push(csvRow.join(','));
  }
  
  // Join rows with newlines
  const csvContent = csvRows.join('\n');
  
  // Add BOM for proper UTF-8 encoding to support Arabic
  const BOM = '\uFEFF';
  return BOM + csvContent;
};

// Download CSV file with proper encoding
export const downloadCSV = (data: any[], filename: string, isRTL: boolean = false): void => {
  const csvContent = generateCSV(data, 
    data.length > 0 ? Object.keys(data[0]).map(key => ({ field: key, header: key })) : [], 
    {}
  );
  
  // Create a blob with UTF-8 BOM for proper Arabic character support
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
  
  // Create download link and trigger click
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  
  // Clean up
  URL.revokeObjectURL(link.href);
};

// Download Excel file
export const downloadExcel = (data: any[], filename: string, isRTL: boolean = false): void => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Set RTL property if needed
  if (isRTL) {
    worksheet['!dir'] = 'rtl';
  }
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  
  // Write the workbook and trigger download
  XLSX.writeFile(workbook, filename);
};

// Helper function to translate text
export const translateReportContent = async (text: string, targetLang: string): Promise<string> => {
  if (!text) return '';
  
  try {
    // In a real implementation, this would call a translation API
    // For now, we'll just return the original text as a placeholder
    console.log(`Would translate "${text}" to ${targetLang}`);
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};

// Generate standardized report
export const generateStandardReport = async (
  title: string,
  dateRange?: { from?: Date; to?: Date; },
  contentRenderer?: (doc: jsPDF, startY: number, isRTL: boolean) => Promise<number> | number,
  language: string = 'en'
): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const isRtl = language === 'ar';
  
  // Add header
  const startY = addReportHeader(doc, title, dateRange, isRtl);
  
  // Add content if renderer provided
  if (contentRenderer) {
    const endY = await contentRenderer(doc, startY, isRtl);
    
    // Add more pages if needed based on content
    if (endY > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
    }
  }
  
  // Add footer
  addReportFooter(doc, isRtl);
  
  return doc;
};
