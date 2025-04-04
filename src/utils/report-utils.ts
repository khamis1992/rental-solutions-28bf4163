
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
