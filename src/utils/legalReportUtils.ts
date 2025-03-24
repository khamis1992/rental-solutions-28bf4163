
import { jsPDF } from 'jspdf';
import { CustomerObligation } from '@/components/legal/CustomerLegalObligations';
import { supabase } from '@/integrations/supabase/client';
import { LANGUAGES } from './reportConstants';
import { formatCurrency, formatDate, getTranslation } from './reportFormatters';

// Define a type for the language options to ensure consistency
export type ReportLanguage = 'english' | 'arabic';

/**
 * Generate a legal report PDF for a customer with all their financial/legal obligations
 */
export const generateLegalCustomerReport = async (
  customerId: string,
  customerName: string,
  obligations: CustomerObligation[],
  language: ReportLanguage = LANGUAGES.ENGLISH
): Promise<jsPDF> => {
  let customer = null;
  let customerVehicles = [];
  
  try {
    // Fetch customer details
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', customerId)
      .single();
    
    if (error) {
      console.error("Error fetching customer details:", error);
    } else {
      customer = data;
    }
    
    // Fetch vehicles associated with the customer through leases
    const { data: leasesData, error: leasesError } = await supabase
      .from('leases')
      .select(`
        vehicle_id,
        vehicles (
          id,
          make,
          model,
          year,
          color,
          license_plate,
          vin,
          status
        )
      `)
      .eq('customer_id', customerId);
    
    if (leasesError) {
      console.error("Error fetching customer vehicles:", leasesError);
    } else if (leasesData) {
      // Extract unique vehicles from leases
      const vehicleMap = new Map();
      leasesData.forEach(lease => {
        if (lease.vehicles && !vehicleMap.has(lease.vehicles.id)) {
          vehicleMap.set(lease.vehicles.id, lease.vehicles);
        }
      });
      customerVehicles = Array.from(vehicleMap.values());
    }
  } catch (error) {
    console.error("Error fetching customer details:", error);
  }
  
  // Initialize the PDF document
  const doc = new jsPDF();
  
  // Add Arabic font support if in Arabic mode
  if (language === LANGUAGES.ARABIC) {
    try {
      // Import and add a proper Arabic font (not a PNG image)
      // Using a standard built-in font as fallback, some basic Arabic might render
      doc.setFont('Helvetica', 'normal');
      doc.setR2L(true); // Set right-to-left mode for Arabic
      
      // Log that we're using the fallback font since we don't have a proper Arabic font yet
      console.log("Using fallback font for Arabic. Consider adding a proper Arabic font.");
    } catch (error) {
      console.error("Error loading Arabic font:", error);
      // Fallback to default font if error occurs
      doc.setFont('Helvetica', 'normal');
    }
  } else {
    doc.setFont('Helvetica', 'normal');
  }
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Define a function to add consistent header to each page
  const addPageHeader = (doc: jsPDF) => {
    // Add logo on the left at the top
    const logoPath = '/lovable-uploads/737e8bf3-01cb-4104-9d28-4e2775eb9efd.png';
    try {
      doc.addImage(logoPath, 'PNG', 14, 10, 40, 15);
    } catch (error) {
      console.error("Error adding logo image:", error);
    }
    
    // Add a separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 30, pageWidth - 14, 30);
    
    return 50; // Return the starting y-position for content after header
  };
  
  // Add header to first page and get starting y-position
  let startY = addPageHeader(doc);
  
  // Add title and header with consistent spacing
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0); // Ensure text is black
  const reportTitle = getTranslation('legalReport', language);
  doc.text(reportTitle, pageWidth / 2, startY, { align: "center" });
  
  // Add address section based on language
  doc.setFontSize(12);
  let lineY = startY + 10;
  
  if (language === LANGUAGES.ARABIC) {
    const currentDate = formatDate(new Date(), language);
    const arabicLines = [
      `السادة/ وزارة الداخلية\t\t\t\t\t\t\t\t\tالتاريخ: ${currentDate}`,
      'مركز ام صلال',
      'الدوحة قطر',
      'تحية طيبة وبعد ،',
      `الموضوع: شكوى ضد السيد/ ${customerName}`
    ];
    
    arabicLines.forEach(line => {
      doc.text(line, pageWidth - 20, lineY, { align: "right" });
      lineY += 7;
    });
  } else {
    const currentDate = formatDate(new Date(), language);
    const englishLines = [
      `To: Ministry of Interior\t\t\t\t\t\t\t\t\tDate: ${currentDate}`,
      'Umm Salal Police Station',
      'Doha, Qatar',
      'Subject: Complaint against Mr. ' + customerName
    ];
    
    englishLines.forEach(line => {
      doc.text(line, 20, lineY);
      lineY += 7;
    });
  }
  
  startY = lineY + 5;
  
  // Add report date with consistent spacing
  doc.setFontSize(10);
  const reportDateText = language === LANGUAGES.ARABIC 
    ? `تم إنشاء التقرير في ${formatDate(new Date(), language)}` 
    : `Report generated on ${formatDate(new Date(), language)}`;
  
  doc.text(reportDateText, pageWidth / 2, startY + 8, { align: "center" });
  
  // Add customer information with consistent spacing
  doc.setFontSize(14);
  const customerInfoTitle = getTranslation('customerInfo', language);
  
  if (language === LANGUAGES.ARABIC) {
    doc.text(customerInfoTitle, pageWidth - 14, startY + 20, { align: "right" });
  } else {
    doc.text(customerInfoTitle, 14, startY + 20);
  }
  
  doc.setFontSize(10);
  let yPos = startY + 30;
  
  if (language === LANGUAGES.ARABIC) {
    doc.text(`الاسم: ${customerName}`, pageWidth - 14, yPos, { align: "right" }); yPos += 7;
    
    if (customer) {
      if (customer.email) {
        doc.text(`البريد الإلكتروني: ${customer.email}`, pageWidth - 14, yPos, { align: "right" }); yPos += 7;
      }
      if (customer.phone_number) {
        doc.text(`الهاتف: ${customer.phone_number}`, pageWidth - 14, yPos, { align: "right" }); yPos += 7;
      }
      if (customer.driver_license) {
        doc.text(`رخصة القيادة: ${customer.driver_license}`, pageWidth - 14, yPos, { align: "right" }); yPos += 7;
      }
    }
  } else {
    doc.text(`Name: ${customerName}`, 14, yPos); yPos += 7;
    
    if (customer) {
      if (customer.email) {
        doc.text(`Email: ${customer.email}`, 14, yPos); yPos += 7;
      }
      if (customer.phone_number) {
        doc.text(`Phone: ${customer.phone_number}`, 14, yPos); yPos += 7;
      }
      if (customer.driver_license) {
        doc.text(`Driver License: ${customer.driver_license}`, 14, yPos); yPos += 7;
      }
    }
  }
  
  // Add vehicle information section
  yPos += 10;
  doc.setFontSize(14);
  const vehicleInfoTitle = getTranslation('vehicleInfo', language);
  
  if (language === LANGUAGES.ARABIC) {
    doc.text(vehicleInfoTitle, pageWidth - 14, yPos, { align: "right" });
  } else {
    doc.text(vehicleInfoTitle, 14, yPos);
  }
  yPos += 10;
  
  doc.setFontSize(10);
  
  if (customerVehicles && customerVehicles.length > 0) {
    customerVehicles.forEach((vehicle, index) => {
      // Check if we need a new page for vehicle info
      if (yPos > 250) {
        doc.addPage();
        yPos = addPageHeader(doc);
        doc.setFontSize(14);
        
        const continuedText = language === LANGUAGES.ARABIC 
          ? "(تابع) " + vehicleInfoTitle 
          : vehicleInfoTitle + " (continued)";
          
        if (language === LANGUAGES.ARABIC) {
          doc.text(continuedText, pageWidth - 14, yPos, { align: "right" });
        } else {
          doc.text(continuedText, 14, yPos);
        }
        
        yPos += 10;
        doc.setFontSize(10);
      }
      
      const notAvailable = getTranslation('notAvailable', language);
      
      if (language === LANGUAGES.ARABIC) {
        doc.text(`المركبة ${index + 1}:`, pageWidth - 14, yPos, { align: "right" }); yPos += 7;
        doc.text(`الصانع: ${vehicle.make || notAvailable}`, pageWidth - 24, yPos, { align: "right" }); yPos += 7;
        doc.text(`الطراز: ${vehicle.model || notAvailable}`, pageWidth - 24, yPos, { align: "right" }); yPos += 7;
        doc.text(`السنة: ${vehicle.year || notAvailable}`, pageWidth - 24, yPos, { align: "right" }); yPos += 7;
        doc.text(`اللون: ${vehicle.color || notAvailable}`, pageWidth - 24, yPos, { align: "right" }); yPos += 7;
        doc.text(`لوحة الترخيص: ${vehicle.license_plate || notAvailable}`, pageWidth - 24, yPos, { align: "right" }); yPos += 7;
        doc.text(`رقم VIN: ${vehicle.vin || notAvailable}`, pageWidth - 24, yPos, { align: "right" }); yPos += 7;
        doc.text(`الحالة: ${vehicle.status || notAvailable}`, pageWidth - 24, yPos, { align: "right" }); yPos += 7;
      } else {
        doc.text(`Vehicle ${index + 1}:`, 14, yPos); yPos += 7;
        doc.text(`Make: ${vehicle.make || notAvailable}`, 24, yPos); yPos += 7;
        doc.text(`Model: ${vehicle.model || notAvailable}`, 24, yPos); yPos += 7;
        doc.text(`Year: ${vehicle.year || notAvailable}`, 24, yPos); yPos += 7;
        doc.text(`Color: ${vehicle.color || notAvailable}`, 24, yPos); yPos += 7;
        doc.text(`License Plate: ${vehicle.license_plate || notAvailable}`, 24, yPos); yPos += 7;
        doc.text(`VIN: ${vehicle.vin || notAvailable}`, 24, yPos); yPos += 7;
        doc.text(`Status: ${vehicle.status || notAvailable}`, 24, yPos); yPos += 7;
      }
      
      // Add a little spacing between vehicles
      if (index < customerVehicles.length - 1) {
        yPos += 3;
      }
    });
  } else {
    const noVehiclesText = language === LANGUAGES.ARABIC 
      ? "لا توجد مركبات مرتبطة بهذا العميل." 
      : "No vehicles associated with this customer.";
      
    if (language === LANGUAGES.ARABIC) {
      doc.text(noVehiclesText, pageWidth - 14, yPos, { align: "right" });
    } else {
      doc.text(noVehiclesText, 14, yPos);
    }
    yPos += 7;
  }
  
  // Add summary of obligations with consistent spacing
  yPos += 10;
  doc.setFontSize(14);
  
  const summaryTitle = language === LANGUAGES.ARABIC 
    ? "ملخص الالتزامات" 
    : "Summary of Obligations";
    
  if (language === LANGUAGES.ARABIC) {
    doc.text(summaryTitle, pageWidth - 14, yPos, { align: "right" });
  } else {
    doc.text(summaryTitle, 14, yPos);
  }
  yPos += 10;
  
  // Group by type of obligation for the summary
  const summaryByType: Record<string, { count: number, totalAmount: number }> = {};
  
  obligations.forEach(obligation => {
    const type = obligation.obligationType || 'other';
    if (!summaryByType[type]) {
      summaryByType[type] = { 
        count: 0, 
        totalAmount: 0 
      };
    }
    summaryByType[type].count += 1;
    summaryByType[type].totalAmount += obligation.amount;
  });
  
  // Calculate total owed
  const totalOwed = obligations.reduce((sum, obligation) => sum + obligation.amount, 0);
  
  // Display summary
  doc.setFontSize(10);
  
  const typeLabels: Record<string, { en: string, ar: string }> = {
    payment: { en: 'Overdue Payments', ar: 'المدفوعات المتأخرة' },
    traffic_fine: { en: 'Traffic Fines', ar: 'مخالفات المرور' },
    legal_case: { en: 'Legal Cases', ar: 'القضايا القانونية' },
    other: { en: 'Other Obligations', ar: 'التزامات أخرى' }
  };
  
  for (const [type, data] of Object.entries(summaryByType)) {
    if (language === LANGUAGES.ARABIC) {
      const label = typeLabels[type]?.ar || type;
      doc.text(`${label}: ${data.count} (المجموع: ${formatCurrency(data.totalAmount, language)})`, pageWidth - 14, yPos, { align: "right" });
    } else {
      const label = typeLabels[type]?.en || type;
      doc.text(`${label}: ${data.count} (Total: ${formatCurrency(data.totalAmount, language)})`, 14, yPos);
    }
    yPos += 7;
  }
  
  // Add total amount
  yPos += 5;
  doc.setFontSize(12);
  
  const totalText = language === LANGUAGES.ARABIC 
    ? `إجمالي المبلغ المستحق: ${formatCurrency(totalOwed, language)}` 
    : `Total Amount Owed: ${formatCurrency(totalOwed, language)}`;
    
  if (language === LANGUAGES.ARABIC) {
    doc.text(totalText, pageWidth - 14, yPos, { align: "right" });
  } else {
    doc.text(totalText, 14, yPos);
  }
  
  // Function to add section headers with consistent spacing
  const addSectionHeader = (text: string, y: number) => {
    doc.setFontSize(14);
    
    if (language === LANGUAGES.ARABIC) {
      doc.text(text, pageWidth - 14, y, { align: "right" });
    } else {
      doc.text(text, 14, y);
    }
    return y + 10; // Return the new y position with consistent spacing
  };
  
  // Add detailed breakdown of obligations with consistent spacing
  yPos += 15;
  yPos = addSectionHeader(language === LANGUAGES.ARABIC ? "تفاصيل الالتزامات" : "Detailed Obligations", yPos);
  
  // Group obligations by type for detailed section
  const obligationsByType: Record<string, CustomerObligation[]> = {};
  
  obligations.forEach(obligation => {
    const type = obligation.obligationType || 'other';
    if (!obligationsByType[type]) {
      obligationsByType[type] = [];
    }
    obligationsByType[type].push(obligation);
  });
  
  // Add each type of obligation
  doc.setFontSize(10);
  
  for (const [type, typeObligations] of Object.entries(obligationsByType)) {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      // Add consistent header to the new page
      yPos = addPageHeader(doc);
      
      // Add section header for this type
      doc.setFontSize(14);
      
      if (language === LANGUAGES.ARABIC) {
        doc.text(`${typeLabels[type]?.ar || type}`, pageWidth - 14, yPos, { align: "right" });
      } else {
        doc.text(`${typeLabels[type]?.en || type}`, 14, yPos);
      }
      
      yPos += 7;
    } else {
      // Add section header for this type
      doc.setFontSize(14);
      
      if (language === LANGUAGES.ARABIC) {
        doc.text(`${typeLabels[type]?.ar || type}`, pageWidth - 14, yPos, { align: "right" });
      } else {
        doc.text(`${typeLabels[type]?.en || type}`, 14, yPos);
      }
      
      yPos += 7;
    }
    
    // Add column headers
    doc.setFontSize(10);
    const startX = language === LANGUAGES.ARABIC ? pageWidth - 14 : 14;
    
    if (language === LANGUAGES.ARABIC) {
      doc.text("المبلغ", startX - 170, yPos, { align: "right" });
      doc.text("أيام التأخير", startX - 130, yPos, { align: "right" });
      doc.text("تاريخ الاستحقاق", startX - 90, yPos, { align: "right" });
      doc.text("الوصف", startX, yPos, { align: "right" });
    } else {
      doc.text("Description", startX, yPos);
      doc.text("Due Date", startX + 90, yPos);
      doc.text("Days Overdue", startX + 130, yPos);
      doc.text("Amount", startX + 170, yPos);
    }
    yPos += 5;
    
    // Add a separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(language === LANGUAGES.ARABIC ? startX - 180 : startX, yPos, language === LANGUAGES.ARABIC ? startX : startX + 180, yPos);
    yPos += 5;
    
    // Add each obligation
    doc.setFontSize(10);
    typeObligations.forEach(obligation => {
      // Check if we need a new page
      if (yPos > 270) {
        doc.addPage();
        // Add consistent header to the new page
        yPos = addPageHeader(doc);
        
        // Add column headers on new page
        doc.setFontSize(10);
        
        if (language === LANGUAGES.ARABIC) {
          doc.text("المبلغ", startX - 170, yPos, { align: "right" });
          doc.text("أيام التأخير", startX - 130, yPos, { align: "right" });
          doc.text("تاريخ الاستحقاق", startX - 90, yPos, { align: "right" });
          doc.text("الوصف", startX, yPos, { align: "right" });
        } else {
          doc.text("Description", startX, yPos);
          doc.text("Due Date", startX + 90, yPos);
          doc.text("Days Overdue", startX + 130, yPos);
          doc.text("Amount", startX + 170, yPos);
        }
        yPos += 5;
        
        // Add a separator line
        doc.setDrawColor(200, 200, 200);
        doc.line(language === LANGUAGES.ARABIC ? startX - 180 : startX, yPos, language === LANGUAGES.ARABIC ? startX : startX + 180, yPos);
        yPos += 5;
      }
      
      // Description text might be long, so we need to handle wrapping
      const description = obligation.description || '';
      const notAvailable = getTranslation('notAvailable', language);
      
      if (language === LANGUAGES.ARABIC) {
        if (description.length > 45) {
          const firstLine = description.substring(0, 45) + '...';
          doc.text(firstLine, startX, yPos, { align: "right" });
        } else {
          doc.text(description, startX, yPos, { align: "right" });
        }
        
        // Add other fields
        const dueDate = obligation.dueDate ? formatDate(obligation.dueDate, language) : notAvailable;
        doc.text(dueDate, startX - 90, yPos, { align: "right" });
        doc.text(obligation.daysOverdue?.toString() || '0', startX - 130, yPos, { align: "right" });
        doc.text(formatCurrency(obligation.amount, language), startX - 170, yPos, { align: "right" });
      } else {
        if (description.length > 45) {
          const firstLine = description.substring(0, 45) + '...';
          doc.text(firstLine, startX, yPos);
        } else {
          doc.text(description, startX, yPos);
        }
        
        // Add other fields
        const dueDate = obligation.dueDate ? formatDate(obligation.dueDate, language) : notAvailable;
        doc.text(dueDate, startX + 90, yPos);
        doc.text(obligation.daysOverdue?.toString() || '0', startX + 130, yPos);
        doc.text(formatCurrency(obligation.amount, language), startX + 170, yPos);
      }
      
      yPos += 7;
    });
    
    yPos += 10;
  }
  
  // Add the footer with company info and logo to each page
  const footerLogoPath = '/lovable-uploads/f81bdd9a-0bfe-4a23-9690-2b9104df3642.png';
  
  // Apply consistent footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Add footer text first - above the footer logo
    doc.setFontSize(10);
    
    if (language === LANGUAGES.ARABIC) {
      doc.text("© 2025 شركة العراف لتأجير السيارات", pageWidth / 2, pageHeight - 30, { align: 'center' });
      doc.setFontSize(8);
      doc.text("خدمة عالية الجودة، تجربة متميزة", pageWidth / 2, pageHeight - 25, { align: 'center' });
    } else {
      doc.text("© 2025 ALARAF CAR RENTAL", pageWidth / 2, pageHeight - 30, { align: 'center' });
      doc.setFontSize(8);
      doc.text("Quality Service, Premium Experience", pageWidth / 2, pageHeight - 25, { align: 'center' });
    }
    
    try {
      // Add the footer image below the text
      doc.addImage(footerLogoPath, 'PNG', 15, pageHeight - 20, pageWidth - 30, 12);
    } catch (error) {
      console.error("Error adding footer logo:", error);
    }
    
    // Add page number
    doc.setFontSize(8);
    const pageText = language === LANGUAGES.ARABIC 
      ? `صفحة ${i} من ${totalPages}` 
      : `Page ${i} of ${totalPages}`;
      
    doc.text(pageText, pageWidth / 2, pageHeight - 5, { align: 'center' });
    
    if (language === LANGUAGES.ARABIC) {
      doc.text('سري', 14, pageHeight - 5);
      doc.text(formatDate(new Date(), language), pageWidth - 14, pageHeight - 5, { align: 'right' });
    } else {
      doc.text('CONFIDENTIAL', 14, pageHeight - 5);
      doc.text(formatDate(new Date(), language), pageWidth - 14, pageHeight - 5, { align: 'right' });
    }
  }
  
  return doc;
};
