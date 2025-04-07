
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { addReportHeader, addReportFooter, generateStandardReport } from '@/utils/report-utils';
import { TrafficFine } from '@/hooks/use-traffic-fines';
import { measurePerformance } from '@/utils/performance-monitoring';

/**
 * Groups traffic fines by customer for better organization in reports
 * @param fines Array of traffic fines
 * @returns Object with customer names as keys and arrays of fines as values
 */
export const groupFinesByCustomer = (fines: TrafficFine[]) => {
  const groupedFines: Record<string, TrafficFine[]> = {};

  fines.forEach(fine => {
    const customerName = fine.customerName || 'Unassigned';
    
    if (!groupedFines[customerName]) {
      groupedFines[customerName] = [];
    }
    
    groupedFines[customerName].push(fine);
  });

  return groupedFines;
};

/**
 * Calculates summary metrics for traffic fines
 * @param fines Array of traffic fines
 * @returns Object containing summary metrics
 */
export const calculateFinesMetrics = (fines: TrafficFine[]) => {
  const totalFines = fines.length;
  const totalAmount = fines.reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
  const paidFines = fines.filter(fine => fine.paymentStatus === 'paid');
  const paidAmount = paidFines.reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
  const pendingAmount = totalAmount - paidAmount;
  const pendingFines = totalFines - paidFines.length;
  const paymentRate = totalFines > 0 ? (paidFines.length / totalFines) * 100 : 0;

  // Added additional metrics for enhanced reporting
  const averageFineAmount = totalFines > 0 ? totalAmount / totalFines : 0;
  const disputedFines = fines.filter(fine => fine.paymentStatus === 'disputed');
  const disputedAmount = disputedFines.reduce((sum, fine) => sum + (fine.fineAmount || 0), 0);
  
  // Time-based analysis
  const finesByMonth = fines.reduce((acc: Record<string, number>, fine) => {
    if (fine.violationDate) {
      const monthYear = format(new Date(fine.violationDate), 'MMM yyyy');
      acc[monthYear] = (acc[monthYear] || 0) + 1;
    }
    return acc;
  }, {});
  
  // Vehicle analysis
  const finesByLicensePlate = fines.reduce((acc: Record<string, number>, fine) => {
    if (fine.licensePlate) {
      acc[fine.licensePlate] = (acc[fine.licensePlate] || 0) + 1;
    }
    return acc;
  }, {});
  
  // Location analysis
  const finesByLocation = fines.reduce((acc: Record<string, number>, fine) => {
    if (fine.location) {
      acc[fine.location] = (acc[fine.location] || 0) + 1;
    }
    return acc;
  }, {});

  return {
    totalFines,
    totalAmount,
    paidFines: paidFines.length,
    paidAmount,
    pendingAmount,
    pendingFines,
    paymentRate: Math.round(paymentRate),
    averageFineAmount,
    disputedFines: disputedFines.length,
    disputedAmount,
    finesByMonth,
    finesByLicensePlate,
    finesByLocation
  };
};

/**
 * Formats date for consistent display across traffic fines reports
 * @param date Date to format
 * @returns Formatted date string
 */
export const formatFineDate = (date: Date | string | undefined) => {
  if (!date) return 'N/A';
  return format(new Date(date), 'dd MMM yyyy');
};

/**
 * Get top locations with the most traffic fines
 * @param fines Array of traffic fines
 * @param limit Number of top locations to return
 * @returns Array of location objects with count and totalAmount
 */
export const getTopFineLocations = (
  fines: TrafficFine[], 
  limit = 5
): { location: string; count: number; totalAmount: number }[] => {
  const locationMap = new Map<string, { count: number; totalAmount: number }>();
  
  fines.forEach(fine => {
    const location = fine.location || 'Unknown';
    if (!locationMap.has(location)) {
      locationMap.set(location, { count: 0, totalAmount: 0 });
    }
    
    const locationData = locationMap.get(location)!;
    locationData.count += 1;
    locationData.totalAmount += fine.fineAmount || 0;
  });
  
  return Array.from(locationMap.entries())
    .map(([location, data]) => ({ location, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

/**
 * Creates a barcode/QR code string representation for the PDF
 * @param data The data to encode in the barcode/QR
 * @returns String representation for the report
 */
const createBarcodeData = (data: string): string => {
  // Simple representation for demonstration - in production, use a proper QR/barcode library
  return `[REPORT-ID:${data}]`;
};

/**
 * Enhanced PDF report generation for traffic fines
 * @param fines Array of traffic fines to include in the report
 * @param dateRange Date range for the report
 * @param options Additional report options
 * @returns Promise resolving to PDF document
 */
export const generateTrafficFinesPDF = async (
  fines: TrafficFine[],
  dateRange: { from: Date | undefined; to: Date | undefined },
  options: {
    includeCoverPage?: boolean;
    includeExecutiveSummary?: boolean;
    includeTimeBasedAnalysis?: boolean;
    includeVehicleAnalysis?: boolean;
    includeCustomerRiskProfile?: boolean;
    includeAppendix?: boolean;
  } = {}
): Promise<jsPDF> => {
  return await measurePerformance('generateTrafficFinesPDF', async () => {
    // Use standardized report generator with enhanced content
    return await generateStandardReport(
      'Traffic Fines Report',
      dateRange,
      async (doc, startY) => {
        console.log("Generating enhanced traffic fines report");
        let yPos = startY;
        
        // Default to including all sections unless explicitly set to false
        const {
          includeCoverPage = true,
          includeExecutiveSummary = true,
          includeTimeBasedAnalysis = true,
          includeVehicleAnalysis = true,
          includeCustomerRiskProfile = true,
          includeAppendix = true
        } = options;

        // Calculate summary metrics
        const metrics = calculateFinesMetrics(fines);
        
        // Generate report ID for tracking and reference
        const reportId = `TFR-${Date.now().toString().substring(6)}`;
        const reportDate = format(new Date(), 'yyyy-MM-dd');
        
        // 1. Cover page (if enabled)
        if (includeCoverPage) {
          doc.setFontSize(26);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(44, 62, 80); // Dark blue heading
          doc.text('TRAFFIC VIOLATIONS', doc.internal.pageSize.getWidth() / 2, 100, { align: 'center' });
          doc.text('COMPREHENSIVE REPORT', doc.internal.pageSize.getWidth() / 2, 115, { align: 'center' });
          
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0); // Black text
          
          // Report metadata
          doc.text(`Report ID: ${reportId}`, doc.internal.pageSize.getWidth() / 2, 140, { align: 'center' });
          doc.text(`Generated on: ${reportDate}`, doc.internal.pageSize.getWidth() / 2, 150, { align: 'center' });
          doc.text(`Period: ${formatFineDate(dateRange.from)} to ${formatFineDate(dateRange.to)}`, 
                  doc.internal.pageSize.getWidth() / 2, 160, { align: 'center' });
          doc.text(`Total Violations: ${metrics.totalFines}`, doc.internal.pageSize.getWidth() / 2, 170, { align: 'center' });
          doc.text(`Total Amount: ${formatCurrency(metrics.totalAmount)}`, doc.internal.pageSize.getWidth() / 2, 180, { align: 'center' });
          
          // Add barcode/QR code for digital scanning
          const barcodeData = createBarcodeData(reportId);
          doc.setFontSize(8);
          doc.text(barcodeData, doc.internal.pageSize.getWidth() / 2, 250, { align: 'center' });
          
          // Add confidentiality notice
          doc.setFontSize(9);
          doc.setTextColor(150, 0, 0); // Dark red for warning
          doc.text('CONFIDENTIAL DOCUMENT', doc.internal.pageSize.getWidth() / 2, 270, { align: 'center' });
          doc.text('For authorized use only', doc.internal.pageSize.getWidth() / 2, 275, { align: 'center' });
          
          doc.addPage();
          yPos = 20;
        }

        // 2. Executive Summary
        if (includeExecutiveSummary) {
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(44, 62, 80); // Dark blue heading
          doc.text('Executive Summary', 14, yPos);
          yPos += 10;
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0); // Reset text color
          
          const summaryText = `This report analyzes ${metrics.totalFines} traffic violations with a total fine amount of ${formatCurrency(metrics.totalAmount)}. `
            + `The payment collection rate is ${metrics.paymentRate}%, with ${metrics.pendingFines} fines still pending payment. `
            + `Average fine amount is ${formatCurrency(metrics.averageFineAmount)}. `
            + `${metrics.disputedFines} fines are currently under dispute, totaling ${formatCurrency(metrics.disputedAmount)}.`;
          
          // Word wrap for paragraph text
          const lines = doc.splitTextToSize(summaryText, 180);
          doc.text(lines, 14, yPos);
          yPos += lines.length * 6 + 10;
          
          // Summary metrics in a visual format
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.1);
          
          // Key metrics in boxes
          const boxWidth = 40;
          const boxHeight = 25;
          const startX = 14;
          let currentX = startX;
          
          // Box 1: Total fines
          doc.rect(currentX, yPos, boxWidth, boxHeight);
          doc.setFont('helvetica', 'bold');
          doc.text('Total Fines', currentX + boxWidth/2, yPos + 6, { align: 'center' });
          doc.setFontSize(14);
          doc.text(metrics.totalFines.toString(), currentX + boxWidth/2, yPos + 16, { align: 'center' });
          currentX += boxWidth + 5;
          
          // Box 2: Payment rate
          doc.rect(currentX, yPos, boxWidth, boxHeight);
          doc.setFontSize(10);
          doc.text('Collection Rate', currentX + boxWidth/2, yPos + 6, { align: 'center' });
          doc.setFontSize(14);
          doc.text(`${metrics.paymentRate}%`, currentX + boxWidth/2, yPos + 16, { align: 'center' });
          currentX += boxWidth + 5;
          
          // Box 3: Paid amount
          doc.rect(currentX, yPos, boxWidth, boxHeight);
          doc.setFontSize(10);
          doc.text('Paid Amount', currentX + boxWidth/2, yPos + 6, { align: 'center' });
          doc.setFontSize(14);
          doc.text(formatCurrency(metrics.paidAmount), currentX + boxWidth/2, yPos + 16, { align: 'center' });
          currentX += boxWidth + 5;
          
          // Box 4: Pending amount
          doc.rect(currentX, yPos, boxWidth, boxHeight);
          doc.setFontSize(10);
          doc.text('Pending Amount', currentX + boxWidth/2, yPos + 6, { align: 'center' });
          doc.setFontSize(14);
          doc.setTextColor(220, 53, 69); // Red color for pending
          doc.text(formatCurrency(metrics.pendingAmount), currentX + boxWidth/2, yPos + 16, { align: 'center' });
          
          // Reset text color
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(10);
          
          yPos += boxHeight + 15;
        }
        
        // 3. Time-Based Analysis
        if (includeTimeBasedAnalysis && Object.keys(metrics.finesByMonth).length > 0) {
          // Check if we need a new page
          if (yPos > 230) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('Time-Based Analysis', 14, yPos);
          yPos += 8;
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text('Distribution of violations over time:', 14, yPos);
          yPos += 10;
          
          // Time-based chart (simple table representation)
          const months = Object.keys(metrics.finesByMonth).sort();
          const monthsCount = months.length;
          
          if (monthsCount > 0) {
            const tableWidth = 180;
            const cellWidth = tableWidth / (monthsCount + 1);
            
            // Table headers
            doc.setFont('helvetica', 'bold');
            doc.text('Month', 14, yPos);
            let xPos = 14 + cellWidth;
            
            months.forEach(month => {
              doc.text(month, xPos, yPos);
              xPos += cellWidth;
            });
            
            yPos += 6;
            doc.line(14, yPos - 2, 14 + tableWidth, yPos - 2);
            
            // Table data row
            doc.setFont('helvetica', 'normal');
            doc.text('Violations', 14, yPos + 6);
            xPos = 14 + cellWidth;
            
            months.forEach(month => {
              doc.text(metrics.finesByMonth[month].toString(), xPos, yPos + 6);
              xPos += cellWidth;
            });
            
            yPos += 12;
          }
        }

        // 4. Vehicle Analysis
        if (includeVehicleAnalysis && Object.keys(metrics.finesByLicensePlate).length > 0) {
          // Check if we need a new page
          if (yPos > 230) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('Vehicle Analysis', 14, yPos);
          yPos += 8;
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text('Vehicles with highest number of violations:', 14, yPos);
          yPos += 10;
          
          // Convert to array for sorting
          const vehicleData = Object.entries(metrics.finesByLicensePlate)
            .map(([plate, count]) => ({ plate, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Top 5 vehicles
          
          if (vehicleData.length > 0) {
            // Vehicle data table
            doc.setFont('helvetica', 'bold');
            doc.text('License Plate', 20, yPos);
            doc.text('Violation Count', 70, yPos);
            yPos += 6;
            
            doc.line(20, yPos - 2, 120, yPos - 2);
            doc.setFont('helvetica', 'normal');
            
            vehicleData.forEach(vehicle => {
              doc.text(vehicle.plate, 20, yPos);
              doc.text(vehicle.count.toString(), 70, yPos);
              yPos += 6;
            });
            
            yPos += 6;
          }
        }
        
        // 5. Customer Risk Profile
        if (includeCustomerRiskProfile) {
          // Check if we need a new page
          if (yPos > 200) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('Customer Risk Profile', 14, yPos);
          yPos += 8;
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          
          // Group fines by customer for risk assessment
          const groupedFines = groupFinesByCustomer(fines);
          const customers = Object.keys(groupedFines).filter(name => name !== 'Unassigned');
          
          if (customers.length > 0) {
            const customerRisks = customers.map(customer => {
              const customerFines = groupedFines[customer];
              const totalFines = customerFines.length;
              const unpaidFines = customerFines.filter(f => f.paymentStatus !== 'paid').length;
              const totalAmount = customerFines.reduce((sum, f) => sum + (f.fineAmount || 0), 0);
              const unpaidAmount = customerFines
                .filter(f => f.paymentStatus !== 'paid')
                .reduce((sum, f) => sum + (f.fineAmount || 0), 0);
              
              // Calculate risk score (simple algorithm for demonstration)
              const paymentRatio = totalFines > 0 ? (totalFines - unpaidFines) / totalFines : 1;
              const riskScore = Math.round((1 - paymentRatio) * 100);
              let riskCategory = 'Low';
              if (riskScore > 60) riskCategory = 'High';
              else if (riskScore > 30) riskCategory = 'Medium';
              
              return {
                customer,
                totalFines,
                unpaidFines,
                totalAmount,
                unpaidAmount,
                riskScore,
                riskCategory
              };
            }).sort((a, b) => b.riskScore - a.riskScore);
            
            doc.text('Customers with highest risk profiles based on violation payment history:', 14, yPos);
            yPos += 10;
            
            // Customer risk table
            doc.setFont('helvetica', 'bold');
            doc.text('Customer', 20, yPos);
            doc.text('Risk', 90, yPos);
            doc.text('Total Fines', 110, yPos);
            doc.text('Unpaid', 140, yPos);
            doc.text('Amount', 170, yPos);
            yPos += 6;
            
            doc.line(20, yPos - 2, 190, yPos - 2);
            doc.setFont('helvetica', 'normal');
            
            // Show top 5 highest risk customers
            customerRisks.slice(0, 5).forEach(risk => {
              // Check if we need a new page
              if (yPos > 270) {
                doc.addPage();
                yPos = 20;
                
                // Add table headers on new page
                doc.setFont('helvetica', 'bold');
                doc.text('Customer', 20, yPos);
                doc.text('Risk', 90, yPos);
                doc.text('Total Fines', 110, yPos);
                doc.text('Unpaid', 140, yPos);
                doc.text('Amount', 170, yPos);
                yPos += 6;
                
                doc.line(20, yPos - 2, 190, yPos - 2);
                doc.setFont('helvetica', 'normal');
              }
              
              const customerName = risk.customer.length > 20 ? 
                risk.customer.substring(0, 17) + '...' : risk.customer;
                
              doc.text(customerName, 20, yPos);
              
              // Color-coded risk level
              if (risk.riskCategory === 'High') {
                doc.setTextColor(220, 53, 69); // Red for high risk
              } else if (risk.riskCategory === 'Medium') {
                doc.setTextColor(255, 193, 7); // Yellow for medium risk
              } else {
                doc.setTextColor(40, 167, 69); // Green for low risk
              }
              
              doc.text(risk.riskCategory, 90, yPos);
              doc.setTextColor(0, 0, 0); // Reset text color
              
              doc.text(risk.totalFines.toString(), 110, yPos);
              doc.text(risk.unpaidFines.toString(), 140, yPos);
              doc.text(formatCurrency(risk.unpaidAmount), 170, yPos);
              
              yPos += 6;
            });
            
            yPos += 10;
          } else {
            doc.text('No customer risk data available - all fines are unassigned.', 14, yPos);
            yPos += 8;
          }
        }
        
        // 6. Detailed fines list
        // Check if we need a new page
        if (yPos > 200) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Traffic Fines Details', 14, yPos);
        yPos += 10;
        
        // Group by customer for better organization
        const groupedFines = groupFinesByCustomer(fines);
        
        // Process customer sections
        for (const [customer, customerFines] of Object.entries(groupedFines)) {
          // Check if we need a new page
          if (yPos > 250) {
            doc.addPage();
            yPos = 20;
          }
          
          // Add customer subheading
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(`Customer: ${customer}`, 14, yPos);
          yPos += 8;
          
          // Add customer summary
          const customerMetrics = calculateFinesMetrics(customerFines);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          doc.text(`Total: ${customerMetrics.totalFines} fines | ${formatCurrency(customerMetrics.totalAmount)} | Paid: ${customerMetrics.paymentRate}%`, 18, yPos);
          yPos += 8;
          
          // Table headers for this customer's fines
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          const headers = ['Date', 'Violation #', 'Location', 'Violation', 'Amount', 'Status'];
          const colWidths = [25, 25, 35, 50, 25, 25];
          
          let xPos = 14;
          headers.forEach((header, i) => {
            doc.text(header, xPos, yPos);
            xPos += colWidths[i];
          });
          yPos += 5;
          
          // Draw horizontal line
          doc.setLineWidth(0.2);
          doc.line(14, yPos, 196, yPos);
          yPos += 5;
          
          // Customer's fines data rows
          doc.setFont('helvetica', 'normal');
          
          for (const fine of customerFines) {
            // Check if we need a new page
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
              
              // Repeat headers on the new page
              xPos = 14;
              doc.setFontSize(9);
              doc.setFont('helvetica', 'bold');
              headers.forEach((header, i) => {
                doc.text(header, xPos, yPos);
                xPos += colWidths[i];
              });
              yPos += 5;
              
              doc.setLineWidth(0.2);
              doc.line(14, yPos, 196, yPos);
              yPos += 5;
              
              doc.setFont('helvetica', 'normal');
            }
            
            xPos = 14;
            
            // Date
            doc.text(formatFineDate(fine.violationDate), xPos, yPos);
            xPos += colWidths[0];
            
            // Violation #
            doc.text(fine.violationNumber || 'N/A', xPos, yPos);
            xPos += colWidths[1];
            
            // Location
            const location = fine.location || 'Unknown';
            doc.text(location.length > 30 ? location.substring(0, 27) + '...' : location, xPos, yPos);
            xPos += colWidths[2];
            
            // Violation charge
            const charge = fine.violationCharge || 'N/A';
            doc.text(charge.length > 45 ? charge.substring(0, 42) + '...' : charge, xPos, yPos);
            xPos += colWidths[3];
            
            // Amount
            doc.text(formatCurrency(fine.fineAmount), xPos, yPos);
            xPos += colWidths[4];
            
            // Status with color coding
            if (fine.paymentStatus === 'paid') {
              doc.setTextColor(0, 128, 0); // Green color for paid
              doc.text('Paid', xPos, yPos);
            } else if (fine.paymentStatus === 'disputed') {
              doc.setTextColor(255, 140, 0); // Orange color for disputed
              doc.text('Disputed', xPos, yPos);
            } else {
              doc.setTextColor(220, 53, 69); // Red color for pending
              doc.text('Pending', xPos, yPos);
            }
            
            doc.setTextColor(0, 0, 0); // Reset text color
            
            yPos += 7;
          }
          
          // Add some space after each customer's section
          yPos += 5;
          doc.line(14, yPos - 2, 196, yPos - 2);
          yPos += 8;
        }
        
        // 7. Appendix (if enabled)
        if (includeAppendix) {
          doc.addPage();
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text('Appendix', 14, 20);
          
          // Legal references section
          doc.setFontSize(12);
          doc.text('Legal References', 14, 35);
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text('This report is generated in compliance with the following regulations:', 14, 45);
          doc.text('• Traffic Management and Control Act of 2022', 18, 55);
          doc.text('• Vehicle Monitoring and Compliance Regulations', 18, 62);
          doc.text('• Data Privacy and Protection Standards', 18, 69);
          
          // Contact information section
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Contact Information', 14, 85);
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text('For questions regarding this report, please contact:', 14, 95);
          doc.text('Traffic Violations Department', 14, 105);
          doc.text('Email: traffic.violations@alaraf.com', 14, 112);
          doc.text('Phone: +974-XXXX-XXXX', 14, 119);
          
          // Report methodology
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Report Methodology', 14, 135);
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const methodologyText = 'This report analyzes traffic violations based on data collected from official regulatory bodies and internal rental records. Violations are categorized by type, location, and payment status. Risk assessments are calculated based on payment history and violation frequency.';
          const methodLines = doc.splitTextToSize(methodologyText, 180);
          doc.text(methodLines, 14, 145);
          
          // Digital signature and authentication info
          doc.setFontSize(8);
          doc.text(`Report verification code: ${reportId}-${Date.now().toString(36).toUpperCase()}`, 14, 170);
          doc.text(`This report was generated automatically. The authenticity can be verified at https://verify.alaraf.com`, 14, 175);

          // Add a legal disclaimer
          doc.setFontSize(8);
          doc.text('DISCLAIMER:', 14, 240);
          const disclaimerText = 'This report is provided for informational purposes only. While every effort has been made to ensure accuracy, we cannot guarantee the completeness or timeliness of the information contained herein. This report should not be considered legal advice. Please consult with appropriate professionals for specific guidance.';
          const disclaimerLines = doc.splitTextToSize(disclaimerText, 180);
          doc.text(disclaimerLines, 14, 245);
        }
        
        return yPos; // Return the final Y position
      }
    );
  });
};
