import { jsPDF } from 'jspdf';
import { CustomerObligation } from '@/components/legal/CustomerLegalObligations';
import { supabase } from '@/integrations/supabase/client';
import { configureFontForLanguage, addArabicText, formatTextForPdf, configureDocumentProperties } from './fontUtils';

/**
 * Generate a legal report PDF for a customer with all their financial/legal obligations
 */
export const generateLegalCustomerReport = async (
  customerId: string,
  customerName: string,
  obligations: CustomerObligation[],
  language: 'english' | 'arabic' = 'english'
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
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  // Configure font based on language
  configureFontForLanguage(doc, language);
  
  // Set document properties (metadata)
  configureDocumentProperties(doc, language);
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Define a function to add consistent header to each page
  const addPageHeader = (doc: jsPDF) => {
    // Add logo on the left at the top
    try {
      const logoPath = '/lovable-uploads/737e8bf3-01cb-4104-9d28-4e2775eb9efd.png';
      doc.addImage(logoPath, 'PNG', 14, 10, 40, 15);
    } catch (error) {
      console.error("Error loading logo:", error);
      // Continue without the logo if it fails to load
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
  
  if (language === 'arabic') {
    addArabicText(doc, "تقرير الالتزامات القانونية", pageWidth / 2, startY, { align: "center" });
  } else {
    doc.text("LEGAL OBLIGATIONS REPORT", pageWidth / 2, startY, { align: "center" });
  }
  
  // Add Arabic address section if in Arabic mode
  if (language === 'arabic') {
    doc.setFontSize(12);
    let arabicLines = [
      `السادة/ وزارة الداخلية\t\t\t\t\t\t\t\t\tالتاريخ: ${new Date().toLocaleDateString('ar-EG')}`,
      'مركز ام صلال',
      'الدوحة قطر',
      'تحية طيبة وبعد ،',
      `الموضوع: شكوى ضد السيد/ ${customerName}`
    ];
    
    let lineY = startY + 10;
    arabicLines.forEach(line => {
      addArabicText(doc, line, pageWidth - 20, lineY, { align: "right" });
      lineY += 7;
    });
    
    startY = lineY + 5;
  } else {
    // Add English address section
    doc.setFontSize(12);
    let englishLines = [
      `To: Ministry of Interior\t\t\t\t\t\t\t\t\tDate: ${new Date().toLocaleDateString()}`,
      'Umm Salal Police Station',
      'Doha, Qatar',
      'Subject: Complaint against Mr. ' + customerName
    ];
    
    let lineY = startY + 10;
    englishLines.forEach(line => {
      doc.text(line, 20, lineY);
      lineY += 7;
    });
    
    startY = lineY + 5;
  }
  
  // Add report date with consistent spacing
  doc.setFontSize(10);
  
  if (language === 'arabic') {
    addArabicText(
      doc,
      `تم إنشاء التقرير في ${new Date().toLocaleDateString('ar-EG')}`,
      pageWidth / 2, startY + 8, 
      { align: "center" }
    );
  } else {
    doc.text(
      `Report generated on ${new Date().toLocaleDateString()}`, 
      pageWidth / 2, startY + 8, 
      { align: "center" }
    );
  }
  
  // Add customer information with consistent spacing
  doc.setFontSize(14);
  
  if (language === 'arabic') {
    addArabicText(doc, "معلومات العميل", pageWidth - 14, startY + 20, { align: "right" });
  } else {
    doc.text("Customer Information", 14, startY + 20);
  }
  
  doc.setFontSize(10);
  let yPos = startY + 30;
  
  if (language === 'arabic') {
    addArabicText(doc, `الاسم: ${customerName}`, pageWidth - 14, yPos, { align: "right" }); 
    yPos += 7;
    
    if (customer) {
      if (customer.email) {
        addArabicText(doc, `البريد الإلكتروني: ${customer.email}`, pageWidth - 14, yPos, { align: "right" }); 
        yPos += 7;
      }
      if (customer.phone_number) {
        addArabicText(doc, `الهاتف: ${customer.phone_number}`, pageWidth - 14, yPos, { align: "right" }); 
        yPos += 7;
      }
      if (customer.driver_license) {
        addArabicText(doc, `رخصة القيادة: ${customer.driver_license}`, pageWidth - 14, yPos, { align: "right" }); 
        yPos += 7;
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
  doc.setFont(language === 'arabic' ? 'Helvetica' : 'helvetica', 'bold');
  
  if (language === 'arabic') {
    addArabicText(doc, "معلومات المركبة", pageWidth - 14, yPos, { align: "right" });
  } else {
    doc.text("Vehicle Information", 14, yPos);
  }
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont(language === 'arabic' ? 'Helvetica' : 'helvetica', 'normal');
  
  if (customerVehicles && customerVehicles.length > 0) {
    customerVehicles.forEach((vehicle, index) => {
      // Check if we need a new page for vehicle info
      if (yPos > 250) {
        doc.addPage();
        yPos = addPageHeader(doc);
        doc.setFontSize(14);
        doc.setFont(language === 'arabic' ? 'Helvetica' : 'helvetica', 'bold');
        
        if (language === 'arabic') {
          addArabicText(doc, "(تابع) معلومات المركبة", pageWidth - 14, yPos, { align: "right" });
        } else {
          doc.text("Vehicle Information (continued)", 14, yPos);
        }
        
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont(language === 'arabic' ? 'Helvetica' : 'helvetica', 'normal');
      }
      
      if (language === 'arabic') {
        addArabicText(doc, `المركبة ${index + 1}:`, pageWidth - 14, yPos, { align: "right" }); yPos += 7;
        addArabicText(doc, `الصانع: ${vehicle.make || 'غير متوفر'}`, pageWidth - 24, yPos, { align: "right" }); yPos += 7;
        addArabicText(doc, `الطراز: ${vehicle.model || 'غير متوفر'}`, pageWidth - 24, yPos, { align: "right" }); yPos += 7;
        addArabicText(doc, `السنة: ${vehicle.year || 'غير متوفر'}`, pageWidth - 24, yPos, { align: "right" }); yPos += 7;
        addArabicText(doc, `اللون: ${vehicle.color || 'غير متوفر'}`, pageWidth - 24, yPos, { align: "right" }); yPos += 7;
        addArabicText(doc, `لوحة الترخيص: ${vehicle.license_plate || 'غير متوفر'}`, pageWidth - 24, yPos, { align: "right" }); yPos += 7;
        addArabicText(doc, `رقم VIN: ${vehicle.vin || 'غير متوفر'}`, pageWidth - 24, yPos, { align: "right" }); yPos += 7;
        addArabicText(doc, `الحالة: ${vehicle.status || 'غير متوفر'}`, pageWidth - 24, yPos, { align: "right" }); yPos += 7;
      } else {
        doc.text(`Vehicle ${index + 1}:`, 14, yPos); yPos += 7;
        doc.text(`Make: ${vehicle.make || 'N/A'}`, 24, yPos); yPos += 7;
        doc.text(`Model: ${vehicle.model || 'N/A'}`, 24, yPos); yPos += 7;
        doc.text(`Year: ${vehicle.year || 'N/A'}`, 24, yPos); yPos += 7;
        doc.text(`Color: ${vehicle.color || 'N/A'}`, 24, yPos); yPos += 7;
        doc.text(`License Plate: ${vehicle.license_plate || 'N/A'}`, 24, yPos); yPos += 7;
        doc.text(`VIN: ${vehicle.vin || 'N/A'}`, 24, yPos); yPos += 7;
        doc.text(`Status: ${vehicle.status || 'N/A'}`, 24, yPos); yPos += 7;
      }
      
      // Add a little spacing between vehicles
      if (index < customerVehicles.length - 1) {
        yPos += 3;
      }
    });
  } else {
    if (language === 'arabic') {
      addArabicText(doc, "لا توجد مركبات مرتبطة بهذا العميل.", pageWidth - 14, yPos, { align: "right" });
    } else {
      doc.text("No vehicles associated with this customer.", 14, yPos);
    }
    yPos += 7;
  }
  
  // Add summary of obligations with consistent spacing
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont(language === 'arabic' ? 'Helvetica' : 'helvetica', 'bold');
  
  if (language === 'arabic') {
    addArabicText(doc, "ملخص الالتزامات", pageWidth - 14, yPos, { align: "right" });
  } else {
    doc.text("Summary of Obligations", 14, yPos);
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
  doc.setFont(language === 'arabic' ? 'Helvetica' : 'helvetica', 'normal');
  
  const typeLabels: Record<string, { en: string, ar: string }> = {
    payment: { en: 'Overdue Payments', ar: 'المدفوعات المتأخرة' },
    traffic_fine: { en: 'Traffic Fines', ar: 'مخالفات المرور' },
    legal_case: { en: 'Legal Cases', ar: 'القضايا القانونية' },
    other: { en: 'Other Obligations', ar: 'التزامات أخرى' }
  };
  
  for (const [type, data] of Object.entries(summaryByType)) {
    if (language === 'arabic') {
      const label = typeLabels[type]?.ar || type;
      const text = `${label}: ${data.count} (المجموع: ${data.totalAmount.toFixed(2)} ر.ق)`;
      addArabicText(doc, text, pageWidth - 14, yPos, { align: "right" });
    } else {
      const label = typeLabels[type]?.en || type;
      doc.text(`${label}: ${data.count} (Total: QAR ${data.totalAmount.toFixed(2)})`, 14, yPos);
    }
    yPos += 7;
  }
  
  // Add total amount
  yPos += 5;
  doc.setFont(language === 'arabic' ? 'Helvetica' : 'helvetica', 'bold');
  
  if (language === 'arabic') {
    const totalText = `إجمالي المبلغ المستحق: ${totalOwed.toFixed(2)} ر.ق`;
    addArabicText(doc, totalText, pageWidth - 14, yPos, { align: "right" });
  } else {
    doc.text(`Total Amount Owed: QAR ${totalOwed.toFixed(2)}`, 14, yPos);
  }
  doc.setFont(language === 'arabic' ? 'Helvetica' : 'helvetica', 'normal');
  
  // Function to add section headers with consistent spacing
  const addSectionHeader = (text: string, y: number) => {
    doc.setFontSize(14);
    doc.setFont(language === 'arabic' ? 'Helvetica' : 'helvetica', 'bold');
    
    if (language === 'arabic') {
      addArabicText(doc, text, pageWidth - 14, y, { align: "right" });
    } else {
      doc.text(text, 14, y);
    }
    return y + 10; // Return the new y position with consistent spacing
  };
  
  // Add detailed breakdown of obligations with consistent spacing
  yPos += 15;
  yPos = addSectionHeader(language === 'arabic' ? "تفاصيل الالتزامات" : "Detailed Obligations", yPos);
  
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
      doc.setFont(language === 'arabic' ? 'Helvetica' : 'helvetica', 'bold');
      
      if (language === 'arabic') {
        doc.text(`${typeLabels[type]?.ar || type}`, pageWidth - 14, yPos, { align: "right" });
      } else {
        doc.text(`${typeLabels[type]?.en || type}`, 14, yPos);
      }
      
      yPos += 7;
    } else {
      // Add section header for this type
      doc.setFont(language === 'arabic' ? 'Helvetica' : 'helvetica', 'bold');
      
      if (language === 'arabic') {
        doc.text(`${typeLabels[type]?.ar || type}`, pageWidth - 14, yPos, { align: "right" });
      } else {
        doc.text(`${typeLabels[type]?.en || type}`, 14, yPos);
      }
      
      yPos += 7;
    }
    
    // Add column headers
    const startX = language === 'arabic' ? pageWidth - 14 : 14;
    
    if (language === 'arabic') {
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
    doc.line(language === 'arabic' ? startX - 180 : startX, yPos, language === 'arabic' ? startX : startX + 180, yPos);
    yPos += 5;
    
    // Add each obligation
    doc.setFont(language === 'arabic' ? 'arabic' : 'helvetica', 'normal');
    typeObligations.forEach(obligation => {
      // Check if we need a new page
      if (yPos > 270) {
        doc.addPage();
        // Add consistent header to the new page
        yPos = addPageHeader(doc);
        
        // Add column headers on new page
        doc.setFont(language === 'arabic' ? 'arabic' : 'helvetica', 'bold');
        
        if (language === 'arabic') {
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
        doc.line(language === 'arabic' ? startX - 180 : startX, yPos, language === 'arabic' ? startX : startX + 180, yPos);
        yPos += 5;
        doc.setFont(language === 'arabic' ? 'arabic' : 'helvetica', 'normal');
      }
      
      // Description text might be long, so we need to handle wrapping
      const description = obligation.description || '';
      
      if (language === 'arabic') {
        if (description.length > 45) {
          const firstLine = description.substring(0, 45) + '...';
          doc.text(firstLine, startX, yPos, { align: "right" });
        } else {
          doc.text(description, startX, yPos, { align: "right" });
        }
        
        // Add other fields
        const dueDate = obligation.dueDate ? new Date(obligation.dueDate).toLocaleDateString('ar-EG') : 'غير متوفر';
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
        const dueDate = obligation.dueDate ? new Date(obligation.dueDate).toLocaleDateString() : 'N/A';
        doc.text(dueDate, startX + 90, yPos);
        doc.text(obligation.daysOverdue?.toString() || '0', startX + 130, yPos);
        doc.text(formatCurrency(obligation.amount, language), startX + 170, yPos);
      }
      
      yPos += 7;
    });
    
    yPos += 10;
  }
  
  // Add the footer with company info and logo to each page
  try {
    const footerLogoPath = '/lovable-uploads/f81bdd9a-0bfe-4a23-9690-2b9104df3642.png';
    
    // Apply consistent footer to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Add footer text first - above the footer logo
      doc.setFontSize(10);
      
      if (language === 'arabic') {
        addArabicText(doc, "© 2025 شركة العراف لتأجير السيارات", pageWidth / 2, pageHeight - 30, { align: 'center' });
        doc.setFontSize(8);
        addArabicText(doc, "خدمة عالية الجودة، تجربة متميزة", pageWidth / 2, pageHeight - 25, { align: 'center' });
      } else {
        doc.text("© 2025 ALARAF CAR RENTAL", pageWidth / 2, pageHeight - 30, { align: 'center' });
        doc.setFontSize(8);
        doc.text("Quality Service, Premium Experience", pageWidth / 2, pageHeight - 25, { align: 'center' });
      }
      
      // Add the footer image below the text
      doc.addImage(footerLogoPath, 'PNG', 15, pageHeight - 20, pageWidth - 30, 12);
      
      // Add page number
      doc.setFontSize(8);
      doc.text(
        language === 'arabic' 
          ? `صفحة ${i} من ${totalPages}` 
          : `Page ${i} of ${totalPages}`, 
        pageWidth / 2, pageHeight - 5, { align: 'center' }
      );
      
      if (language === 'arabic') {
        doc.text('سري', 14, pageHeight - 5);
        doc.text(new Date().toLocaleDateString('ar-EG'), pageWidth - 14, pageHeight - 5, { align: 'right' });
      } else {
        doc.text('CONFIDENTIAL', 14, pageHeight - 5);
        doc.text(new Date().toLocaleDateString(), pageWidth - 14, pageHeight - 5, { align: 'right' });
      }
    }
  } catch (error) {
    console.error("Error adding footer:", error);
    // Continue without footer if it fails
  }
  
  return doc;
};

// Helper function to format currency
const formatCurrency = (amount: number, language: 'english' | 'arabic' = 'english'): string => {
  if (language === 'arabic') {
    return new Intl.NumberFormat('ar-QA', {
      style: 'currency',
      currency: 'QAR',
      minimumFractionDigits: 2
    }).format(amount);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'QAR',
    minimumFractionDigits: 2
  }).format(amount);
};
