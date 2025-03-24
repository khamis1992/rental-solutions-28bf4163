
import { jsPDF } from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { loadArabicFont } from './fontLoader';

interface ReportData {
  customer: {
    id: string;
    full_name: string;
    phone_number: string;
    driver_license: string;
    nationality: string;
  };
  vehicle: {
    make: string;
    model: string;
    license_plate: string;
    year: string;
  };
  lease: {
    agreement_number: string;
    start_date: string;
    rent_amount: number;
  };
  financials: {
    pendingAmount: number;
    lateFees: number;
    trafficFinesAmount: number;
    totalAmount: number;
  };
}

/**
 * Generate a police report for a customer with outstanding obligations
 */
export const generatePoliceReport = async (
  customerId: string
): Promise<{ success: boolean; fileName?: string; error?: string }> => {
  try {
    console.log('Generating police report for customer:', customerId);
    
    // Load Arabic font
    await loadArabicFont();
    
    // Fetch all required data for the report
    const reportData = await fetchReportData(customerId);
    
    if (!reportData) {
      return { 
        success: false, 
        error: 'Could not fetch required data for the report' 
      };
    }
    
    // Create the PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Set document language to Arabic with RTL direction
    doc.setLanguage('ar');
    doc.setR2L(true);
    
    // Set font to Amiri (added by our font loader)
    doc.setFont('Amiri');
    
    // Format the current date in Arabic format
    const today = new Date();
    const formattedDate = new Intl.DateTimeFormat('ar-QA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(today);
    
    // Generate the report content
    generateReportContent(doc, reportData, formattedDate);
    
    // Prepare file name using customer name with fallback
    const fileName = reportData.customer.full_name.trim() || 'police-report';
    
    // Save and download the PDF
    doc.save(`${fileName}.pdf`);
    
    return { 
      success: true,
      fileName
    };
  } catch (error) {
    console.error('Error generating police report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate police report'
    };
  }
};

/**
 * Fetch all data required for the police report
 */
const fetchReportData = async (customerId: string): Promise<ReportData | null> => {
  try {
    // Step 1: Fetch customer information
    const { data: customer, error: customerError } = await supabase
      .from('profiles')
      .select('id, full_name, phone_number, driver_license, nationality')
      .eq('id', customerId)
      .single();
    
    if (customerError || !customer) {
      console.error('Error fetching customer:', customerError);
      return null;
    }
    
    // Step 2: Find active lease for this customer
    const { data: leases, error: leasesError } = await supabase
      .from('leases')
      .select(`
        id, 
        agreement_number, 
        start_date, 
        rent_amount,
        vehicle_id
      `)
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .order('start_date', { ascending: false });
    
    if (leasesError) {
      console.error('Error fetching leases:', leasesError);
      return null;
    }
    
    if (!leases || leases.length === 0) {
      console.error('No active leases found for customer:', customerId);
      return null;
    }
    
    // Use the most recent lease
    const lease = leases[0];
    
    // Step 3: Fetch vehicle information
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('make, model, license_plate, year')
      .eq('id', lease.vehicle_id)
      .single();
    
    if (vehicleError || !vehicle) {
      console.error('Error fetching vehicle:', vehicleError);
      return null;
    }
    
    // Step 4: Calculate pending payment amounts
    const { data: payments, error: paymentsError } = await supabase
      .from('unified_payments')
      .select('balance, amount')
      .eq('lease_id', lease.id)
      .eq('status', 'pending');
    
    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return null;
    }
    
    // Calculate pending amount (unpaid rent)
    const pendingAmount = payments?.reduce((sum, payment) => sum + (payment.balance || 0), 0) || 0;
    
    // Step 5: Calculate late fees (120 QAR per day, max 3000 QAR per month)
    const { data: overduePayments, error: overdueError } = await supabase
      .from('unified_payments')
      .select('days_overdue')
      .eq('lease_id', lease.id)
      .eq('status', 'pending')
      .gt('days_overdue', 0);
    
    if (overdueError) {
      console.error('Error fetching overdue payments:', overdueError);
      return null;
    }
    
    // Calculate late fees (120 QAR per day, max 3000 QAR per payment)
    const lateFees = overduePayments?.reduce((sum, payment) => {
      const daysFee = (payment.days_overdue || 0) * 120;
      return sum + Math.min(daysFee, 3000);
    }, 0) || 0;
    
    // Step 6: Calculate traffic fines
    const { data: trafficFines, error: finesError } = await supabase
      .from('traffic_fines')
      .select('fine_amount')
      .eq('lease_id', lease.id)
      .eq('payment_status', 'pending');
    
    if (finesError) {
      console.error('Error fetching traffic fines:', finesError);
      return null;
    }
    
    const trafficFinesAmount = trafficFines?.reduce((sum, fine) => sum + (fine.fine_amount || 0), 0) || 0;
    
    // Step 7: Calculate total amount
    const totalAmount = pendingAmount + lateFees + trafficFinesAmount;
    
    // Return all the data required for the report
    return {
      customer,
      vehicle: {
        make: vehicle.make,
        model: vehicle.model,
        license_plate: vehicle.license_plate,
        year: String(vehicle.year) // Convert year to string to match the interface
      },
      lease: {
        agreement_number: lease.agreement_number,
        start_date: lease.start_date,
        rent_amount: lease.rent_amount || 0
      },
      financials: {
        pendingAmount,
        lateFees,
        trafficFinesAmount,
        totalAmount
      }
    };
  } catch (error) {
    console.error('Error fetching report data:', error);
    return null;
  }
};

/**
 * Generate the content of the police report
 */
const generateReportContent = (doc: jsPDF, data: ReportData, formattedDate: string) => {
  // Set font size and line height
  const fontSize = 12;
  const lineHeight = 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  
  // Start position
  let y = 20;
  
  // Add header
  doc.setFontSize(16);
  doc.text(`السادة/ وزارة الداخلية`, pageWidth - margin, y);
  doc.text(`التاريخ: ${formattedDate}`, margin, y);
  y += lineHeight + 5;
  
  doc.setFontSize(14);
  doc.text('مركز ام صلال', pageWidth - margin, y);
  y += lineHeight;
  
  doc.text('الدوحة قطر', pageWidth - margin, y);
  y += lineHeight;
  
  doc.text('تحية طيبة وبعد ،', pageWidth - margin, y);
  y += lineHeight;
  
  // Add subject line
  doc.setFontSize(14);
  doc.text(`الموضوع: شكوى ضد السيد/ ${data.customer.full_name}`, pageWidth - margin, y);
  y += lineHeight * 2;
  
  // Add greeting
  doc.setFontSize(12);
  doc.text('السلام عليكم ورحمة الله وبركاتة .', pageWidth - margin, y);
  y += lineHeight * 1.5;
  
  // Add company information
  doc.text('نتوجة اليكم نحن شركة العراف لتاجير السيارات والكائن مقرها بدائرة اختصاصكم – ام صلال منطقة 71 مبن�� 79 الشارع التجاري', pageWidth - margin, y);
  y += lineHeight * 1.5;
  
  // Add customer information
  doc.text(`نتقدم بشكوى ضد السيد / ${data.customer.full_name} الجنسية ${data.customer.nationality || 'قطري'} رقم شخصي ${data.customer.driver_license || '-'} هاتف رقم ${data.customer.phone_number || '-'}`, pageWidth - margin, y);
  y += lineHeight * 2;
  
  // Add vehicle information table
  doc.text('موديل', pageWidth - margin, y);
  doc.text('رقم اللوحة', pageWidth - margin - 40, y);
  doc.text('نوع السيارة', pageWidth - margin - 80, y);
  y += lineHeight;
  
  doc.text(data.vehicle.year || '-', pageWidth - margin, y);
  doc.text(data.vehicle.license_plate || '-', pageWidth - margin - 40, y);
  doc.text(data.vehicle.make || '-', pageWidth - margin - 80, y);
  y += lineHeight * 2;
  
  // Add complaint details
  const rentAmount = formatCurrency(data.lease.rent_amount).replace('QAR', 'ريال');
  const pendingAmount = formatCurrency(data.financials.pendingAmount).replace('QAR', 'ريال');
  const lateFees = formatCurrency(data.financials.lateFees).replace('QAR', 'ريال');
  const trafficFines = formatCurrency(data.financials.trafficFinesAmount).replace('QAR', 'ريال');
  const totalAmount = formatCurrency(data.financials.totalAmount).replace('QAR', 'ريال');
  
  // Format start date
  const startDate = new Date(data.lease.start_date);
  const formattedStartDate = new Intl.DateTimeFormat('ar-QA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(startDate);
  
  // Add complaint text
  const complaintText = `المشكو ضدة استاجر السيارة اعلاة بموجب عقد بتاريخ ${formattedStartDate} بقيمة اجرة شهرية مبلغ ${rentAmount} وتاخر وامتنع عن سداد مستحقات الاجرة على الرغم من انتهاء العقد قيمة المتاخرات المترصدة في ذمته ${pendingAmount} ريال وغرامة تاخير ${lateFees} ريال وقيمة المخالفات المرورية ${trafficFines} ريال مجموع المطالبة ${totalAmount} ريال`;
  
  // Break long text into multiple lines
  const complaintLines = doc.splitTextToSize(complaintText, pageWidth - (margin * 2));
  doc.text(complaintLines, pageWidth - margin, y, { align: 'right' });
  y += complaintLines.length * lineHeight + 10;
  
  // Add legal basis
  doc.text('وبناء على ما سبق اتطلع من سيادتكم القيام باتخاذ الاجراءات القانونية اللازم لمقاضاة المشكو ضدة واطالب بحق الشركة القانوني:', pageWidth - margin, y);
  y += lineHeight * 1.5;
  
  doc.text('المشكو ضدة خالف المادة 349 من القانون رقم 11 سنة 2024', pageWidth - margin, y);
  y += lineHeight * 1.5;
  
  const lawText = 'يعاقب بالحبس مدة لا تتجاوز ثلاث سنوات ، وبالغرامة التي لا تزيد عن ثلاثة الف ريال ، او باحدى هاتين العقوبتين كل من تناول طعاما او شرابا في محل معد لذلك ولو كان مقيما فيه ، وكذلك كل من شغل غرفة او اكثر في فندق او نحوه ، او استأجر وسيلة نقل معدة للايجار ، او حصل على وقود لوسيلة نقل ، مع علمه انه يستحيل عليه دفع الثمن او الاجرة ، او امتنع بغير مبرر عن دفع ما استحق عليه من ذلك او فر دون الوفاء به';
  
  // Break long text into multiple lines
  const lawLines = doc.splitTextToSize(lawText, pageWidth - (margin * 2));
  doc.text(lawLines, pageWidth - margin, y, { align: 'right' });
  y += lawLines.length * lineHeight + 10;
  
  // Add requests
  doc.text('الطلبات', pageWidth - margin, y);
  y += lineHeight * 1.5;
  
  doc.text('1. متاخرات الاجرة الى حين التسليم', pageWidth - margin, y);
  y += lineHeight;
  
  doc.text('2. قيمة المخالفات المرورية', pageWidth - margin, y);
  y += lineHeight;
  
  doc.text('3. قيمة اي اضرار على السيارة ان وجدت', pageWidth - margin, y);
  y += lineHeight;
  
  doc.text('4. غرمات التاخير', pageWidth - margin, y);
  y += lineHeight * 2;
  
  // Add representative information
  doc.text('ولقد فوضنا السيد / اسامة احمد البشري عبدالمنعم حامل بطاقة شخصية رقم – 29273601820 لمتابعة وانهاء كافة الاجراءات المتعلقة بالشكوى لدى ادارتكم', pageWidth - margin, y);
  y += lineHeight * 2;
  
  // Add closing
  doc.text('وتفضول بقبول عظيم الاحترام والتقدير', pageWidth - margin, y);
  y += lineHeight * 5;
  
  // Add signature block
  doc.text('توقيع', 40, y);
  doc.text('ختم الشركة', 120, y);
};

