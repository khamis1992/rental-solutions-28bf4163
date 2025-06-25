import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { 
  generateUnifiedPDF, 
  createInfoCard, 
  createDataTable, 
  createSummaryCard,
  createHighlightBox,
  PDFConfig,
  PDFStyles 
} from '@/utils/unified-pdf-generator';

export interface ReportDownloadOptionsProps {
  reportType: string;
  getReportData: () => any[];
}

/**
 * إنشاء تقرير PDF متطور لكل نوع تقرير
 */
async function generateModernReportPDF(reportType: string, data: any[]): Promise<void> {
      if (!data || data.length === 0) {
        toast.error('لا توجد بيانات للتصدير');
        return;
      }
      
  let content = '';
  let title = '';
  let styles: PDFStyles = {
    primaryColor: '#1e3a8a',
    secondaryColor: '#64748b',
    backgroundColor: '#f1f5f9'
  };

  switch (reportType) {
    case 'traffic':
      content = await generateTrafficReportContent(data);
      title = 'تقرير المخالفات المرورية الشامل';
      styles.primaryColor = '#dc2626';
      styles.backgroundColor = '#fef2f2';
      break;
    
    case 'fleet':
      content = await generateFleetReportContent(data);
      title = 'تقرير الأسطول والمركبات';
      styles.primaryColor = '#059669';
      styles.backgroundColor = '#f0fdf4';
      break;
    
    case 'financial':
      content = await generateFinancialReportContent(data);
      title = 'التقرير المالي الشامل';
      styles.primaryColor = '#7c3aed';
      styles.backgroundColor = '#faf5ff';
      break;
    
    case 'customers':
      content = await generateCustomersReportContent(data);
      title = 'تقرير العملاء والاشتراكات';
      styles.primaryColor = '#ea580c';
      styles.backgroundColor = '#fff7ed';
      break;
    
    case 'maintenance':
      content = await generateMaintenanceReportContent(data);
      title = 'تقرير الصيانة والأعطال';
      styles.primaryColor = '#0891b2';
      styles.backgroundColor = '#f0f9ff';
      break;
    
    case 'legal':
      content = await generateLegalReportContent(data);
      title = 'التقرير القانوني والقضايا';
      styles.primaryColor = '#be123c';
      styles.backgroundColor = '#fdf2f8';
      break;
    
    default:
      content = await generateGenericReportContent(data, reportType);
      title = `تقرير ${reportType.toUpperCase()}`;
  }

  const config: PDFConfig = {
    title,
    filename: `تقرير-${reportType}-${formatDate(new Date())}`,
    rtl: true,
    companyInfo: true,
    includeFooter: true
  };

  await generateUnifiedPDF({
    config,
    content,
    styles
  });
}

/**
 * إنشاء محتوى تقرير المخالفات المرورية
 */
async function generateTrafficReportContent(data: any[]): Promise<string> {
          const totalAmount = data.reduce((sum, item) => {
            const amount = typeof item.fineAmount === 'string' 
              ? parseFloat(item.fineAmount.replace(/[^\d.-]/g, ''))
              : (item.fineAmount || 0);
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0);
          
  const totalFines = data.length;
  const paidFines = data.filter(fine => fine.status === 'paid').length;
  const pendingFines = totalFines - paidFines;

  // إحصائيات سريعة
  const summaryCards = `
    <div class="summary-cards">
      ${createSummaryCard('إجمالي المخالفات', totalFines, 'neutral', false, true)}
      ${createSummaryCard('المخالفات المدفوعة', paidFines, 'positive', false, true)}
      ${createSummaryCard('المخالفات المعلقة', pendingFines, 'warning', false, true)}
      ${createSummaryCard('إجمالي المبلغ', totalAmount, 'neutral')}
    </div>
  `;

  // تجميع المخالفات حسب العميل
  const customerGroups: Record<string, any[]> = {};
  data.forEach(fine => {
    const customerName = fine.customerName || 'غير محدد';
    if (!customerGroups[customerName]) {
      customerGroups[customerName] = [];
    }
    customerGroups[customerName].push(fine);
  });

  // جداول المخالفات لكل عميل
  let customerTables = '';
  Object.entries(customerGroups).forEach(([customerName, customerFines]) => {
    const customerTotal = customerFines.reduce((sum, fine) => {
      const amount = typeof fine.fineAmount === 'string' 
        ? parseFloat(fine.fineAmount.replace(/[^\d.-]/g, ''))
        : (fine.fineAmount || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    customerTables += `
      <h3 class="section-header" style="background: #dc2626; color: white; padding: 12px; border-radius: 8px; margin-top: 30px;">
        ${customerName} - المجموع: ${formatCurrency(customerTotal)} ر.ق
      </h3>
    `;

    const headers = ['رقم المخالفة', 'لوحة الترخيص', 'تاريخ المخالفة', 'نوع المخالفة', 'المبلغ', 'الحالة'];
    const rows = customerFines.map(fine => [
      fine.violationNumber || 'غير محدد',
      fine.licensePlate || 'غير محدد',
      fine.violationDate ? formatDate(fine.violationDate) : 'غير محدد',
      fine.violationType || 'غير محدد',
      formatCurrency(fine.fineAmount || 0) + ' ر.ق',
      fine.status === 'paid' ? '✅ مدفوعة' : '⏳ معلقة'
    ]);

    customerTables += createDataTable(headers, rows);
  });

  // تنبيهات هامة
  const alerts = createHighlightBox(
    `
      <h4>🚨 تنبيهات مهمة:</h4>
      <ul style="padding-right: 20px; line-height: 1.8;">
        <li><strong>المخالفات المعلقة:</strong> يجب سداد ${pendingFines} مخالفة لتجنب المشاكل القانونية</li>
        <li><strong>إجمالي المبلغ المطلوب:</strong> ${formatCurrency(totalAmount)} ريال قطري</li>
        <li><strong>تاريخ التقرير:</strong> ${formatDate(new Date())}</li>
        <li><strong>صالح لمدة:</strong> 30 يوماً من تاريخ الإصدار</li>
      </ul>
    `,
    'alert'
  );

  return `
    ${summaryCards}
    
    <h2 class="section-header">📊 ملخص التحليل</h2>
    <div style="background: #fef2f2; border: 2px solid #dc2626; border-radius: 10px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 16px; line-height: 1.8;">
        يحتوي هذا التقرير على <strong style="color: #dc2626;">${totalFines} مخالفة مرورية</strong> 
        بإجمالي قيمة <strong style="color: #dc2626;">${formatCurrency(totalAmount)} ريال قطري</strong>. 
        تم سداد <strong style="color: #16a34a;">${paidFines} مخالفة</strong> ولا يزال هناك 
        <strong style="color: #f59e0b;">${pendingFines} مخالفة معلقة</strong> تحتاج إلى سداد.
      </p>
    </div>
    
    ${alerts}
    
    <h2 class="section-header">📋 تفاصيل المخالفات حسب العميل</h2>
    ${customerTables}
  `;
}

/**
 * إنشاء محتوى تقرير الأسطول
 */
async function generateFleetReportContent(data: any[]): Promise<string> {
  const totalVehicles = data.length;
  const availableVehicles = data.filter(v => v.status === 'available').length;
  const rentedVehicles = data.filter(v => v.status === 'rented').length;
  const maintenanceVehicles = data.filter(v => v.status === 'maintenance').length;

  const summaryCards = `
    <div class="summary-cards">
      ${createSummaryCard('إجمالي المركبات', totalVehicles, 'neutral', false, true)}
      ${createSummaryCard('المركبات المتاحة', availableVehicles, 'positive', false, true)}
      ${createSummaryCard('المركبات المؤجرة', rentedVehicles, 'warning', false, true)}
      ${createSummaryCard('في الصيانة', maintenanceVehicles, 'negative', false, true)}
    </div>
  `;

  const headers = ['الماركة والموديل', 'لوحة الترخيص', 'سنة الصنع', 'الحالة', 'السعر اليومي', 'آخر صيانة'];
  const rows = data.map(vehicle => [
    `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'غير محدد',
    vehicle.license_plate || 'غير محدد',
    vehicle.year?.toString() || 'غير محدد',
    vehicle.status === 'available' ? '✅ متاحة' :
    vehicle.status === 'rented' ? '🚗 مؤجرة' : 
    vehicle.status === 'maintenance' ? '🔧 صيانة' : 'غير محدد',
    vehicle.daily_rate ? formatCurrency(vehicle.daily_rate) + ' ر.ق' : 'غير محدد',
    vehicle.last_maintenance ? formatDate(vehicle.last_maintenance) : 'غير محدد'
  ]);

  return `
    ${summaryCards}
    
    <h2 class="section-header">🚗 تفاصيل الأسطول</h2>
    ${createDataTable(headers, rows)}
    
    ${createHighlightBox(
      `
        <h4>📈 تحليل الأداء:</h4>
        <p>معدل الاستغلال: ${((rentedVehicles / totalVehicles) * 100).toFixed(1)}%</p>
        <p>معدل الصيانة: ${((maintenanceVehicles / totalVehicles) * 100).toFixed(1)}%</p>
        <p>معدل التوفر: ${((availableVehicles / totalVehicles) * 100).toFixed(1)}%</p>
      `,
      'success'
    )}
  `;
}

/**
 * إنشاء محتوى التقرير المالي
 */
async function generateFinancialReportContent(data: any[]): Promise<string> {
  console.log('بيانات التقرير المالي:', data);
  
  // التأكد من وجود البيانات
  if (!data || data.length === 0) {
    return createHighlightBox(
      `
        <h4>📊 لا توجد بيانات مالية</h4>
        <p>لا توجد معاملات مالية متاحة لإنشاء التقرير. يرجى:</p>
        <ul style="padding-right: 20px; line-height: 1.8;">
          <li>التأكد من وجود معاملات مالية في النظام</li>
          <li>فحص إعدادات قاعدة البيانات</li>
          <li>التأكد من صحة البيانات المدخلة</li>
        </ul>
      `,
      'warning'
    );
  }
  
  // فصل الإيرادات والمصروفات
  const incomeTransactions = data.filter(item => item.type === 'income');
  const expenseTransactions = data.filter(item => item.type === 'expense');
  
  const totalIncome = incomeTransactions.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalExpenses = expenseTransactions.reduce((sum, item) => sum + (item.amount || 0), 0);
  const netRevenue = totalIncome - totalExpenses;
  
  // حساب البيانات حسب الحالة
  const completedTransactions = data.filter(item => item.status === 'completed');
  const pendingTransactions = data.filter(item => item.status === 'pending');
  const failedTransactions = data.filter(item => item.status === 'failed');
  
  const completedAmount = completedTransactions.reduce((sum, item) => sum + (item.amount || 0), 0);
  const pendingAmount = pendingTransactions.reduce((sum, item) => sum + (item.amount || 0), 0);
  
  const summaryCards = `
    <div class="summary-cards">
      ${createSummaryCard('إجمالي الإيرادات', totalIncome, 'positive')}
      ${createSummaryCard('إجمالي المصروفات', totalExpenses, 'negative')}
      ${createSummaryCard('صافي الدخل', netRevenue, netRevenue >= 0 ? 'positive' : 'negative')}
      ${createSummaryCard('المبالغ المكتملة', completedAmount, 'positive')}
      ${createSummaryCard('المبالغ المعلقة', pendingAmount, 'warning')}
      ${createSummaryCard('نسبة التحصيل', totalIncome > 0 ? (completedAmount / totalIncome * 100) : 0, 'neutral', true)}
    </div>
  `;

  // إحصائيات التحليل
  const analysisSection = `
    <h2 class="section-header">📊 تحليل الأداء المالي</h2>
    <div style="background: #f8fafc; border: 2px solid #64748b; border-radius: 10px; padding: 20px; margin: 20px 0;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
        <div style="text-align: center;">
          <h4 style="color: #16a34a; margin: 0 0 5px 0;">الإيرادات</h4>
          <p style="font-size: 24px; font-weight: bold; color: #16a34a; margin: 0;">${formatCurrency(totalIncome)} ر.ق</p>
          <small style="color: #64748b;">${incomeTransactions.length} معاملة</small>
        </div>
        <div style="text-align: center;">
          <h4 style="color: #dc2626; margin: 0 0 5px 0;">المصروفات</h4>
          <p style="font-size: 24px; font-weight: bold; color: #dc2626; margin: 0;">${formatCurrency(totalExpenses)} ر.ق</p>
          <small style="color: #64748b;">${expenseTransactions.length} معاملة</small>
        </div>
        <div style="text-align: center;">
          <h4 style="color: ${netRevenue >= 0 ? '#16a34a' : '#dc2626'}; margin: 0 0 5px 0;">صافي الدخل</h4>
          <p style="font-size: 24px; font-weight: bold; color: ${netRevenue >= 0 ? '#16a34a' : '#dc2626'}; margin: 0;">${formatCurrency(netRevenue)} ر.ق</p>
          <small style="color: #64748b;">${netRevenue >= 0 ? 'ربح' : 'خسارة'}</small>
        </div>
      </div>
    </div>
  `;

  // جدول الإيرادات
  let incomeSection = '';
  if (incomeTransactions.length > 0) {
    const incomeHeaders = ['التاريخ', 'الوصف', 'المبلغ', 'الحالة', 'طريقة الدفع', 'المرجع'];
    const incomeRows = incomeTransactions.map(item => [
      item.date ? formatDate(item.date) : 'غير محدد',
      item.description || 'غير محدد',
      formatCurrency(item.amount || 0) + ' ر.ق',
      item.status === 'completed' ? '✅ مكتمل' : 
      item.status === 'pending' ? '⏳ معلق' : 
      item.status === 'failed' ? '❌ فاشل' : 'غير محدد',
      item.paymentMethod || 'غير محدد',
      item.reference || 'غير محدد'
    ]);

    incomeSection = `
      <h2 class="section-header" style="background: #16a34a; color: white; padding: 12px; border-radius: 8px;">💰 الإيرادات</h2>
      ${createDataTable(incomeHeaders, incomeRows)}
    `;
  } else {
    incomeSection = createHighlightBox(
      '<h4>💰 لا توجد إيرادات</h4><p>لم يتم العثور على أي معاملات إيرادات في الفترة المحددة.</p>',
      'warning'
    );
  }

  // جدول المصروفات  
  let expenseSection = '';
  if (expenseTransactions.length > 0) {
    const expenseHeaders = ['التاريخ', 'الوصف', 'المبلغ', 'الحالة', 'طريقة الدفع', 'الفئة'];
    const expenseRows = expenseTransactions.map(item => [
      item.date ? formatDate(item.date) : 'غير محدد',
      item.description || 'غير محدد',
      formatCurrency(item.amount || 0) + ' ر.ق',
      item.status === 'completed' ? '✅ مكتمل' : 
      item.status === 'pending' ? '⏳ معلق' : 
      item.status === 'failed' ? '❌ فاشل' : 'غير محدد',
      item.paymentMethod || 'غير محدد',
      item.category || 'غير محدد'
    ]);

    expenseSection = `
      <h2 class="section-header" style="background: #dc2626; color: white; padding: 12px; border-radius: 8px;">💸 المصروفات</h2>
      ${createDataTable(expenseHeaders, expenseRows)}
    `;
        } else {
    expenseSection = createHighlightBox(
      '<h4>💸 لا توجد مصروفات</h4><p>لم يتم العثور على أي معاملات مصروفات في الفترة المحددة.</p>',
      'warning'
    );
  }

  // تنبيهات
  let alertsSection = '';
  if (pendingTransactions.length > 0 || failedTransactions.length > 0 || netRevenue < 0) {
    alertsSection = createHighlightBox(
      `
        <h4>⚠️ تنبيهات مالية مهمة:</h4>
        <ul style="padding-right: 20px; line-height: 1.8;">
          ${pendingTransactions.length > 0 ? `<li><strong>معاملات معلقة:</strong> ${pendingTransactions.length} معاملة بقيمة ${formatCurrency(pendingAmount)} ر.ق</li>` : ''}
          ${failedTransactions.length > 0 ? `<li><strong>معاملات فاشلة:</strong> ${failedTransactions.length} معاملة تحتاج مراجعة</li>` : ''}
          ${netRevenue < 0 ? `<li><strong>خسارة مالية:</strong> صافي الدخل سالب بقيمة ${formatCurrency(Math.abs(netRevenue))} ر.ق</li>` : ''}
          <li><strong>تاريخ التقرير:</strong> ${formatDate(new Date())}</li>
        </ul>
      `,
      netRevenue < 0 ? 'alert' : 'warning'
    );
  }

  // إضافة تحليل إضافي للفئات
  const categoryAnalysis = (() => {
    const categories: Record<string, { income: number; expense: number; count: number }> = {};
    
    data.forEach(item => {
      const category = item.category || 'غير محدد';
      if (!categories[category]) {
        categories[category] = { income: 0, expense: 0, count: 0 };
      }
      
      categories[category].count += 1;
      if (item.type === 'income') {
        categories[category].income += item.amount || 0;
      } else {
        categories[category].expense += item.amount || 0;
      }
    });

    if (Object.keys(categories).length === 0) {
      return '';
    }

    const categoryHeaders = ['الفئة', 'عدد المعاملات', 'الإيرادات', 'المصروفات', 'الصافي'];
    const categoryRows = Object.entries(categories).map(([category, categoryData]) => [
      category,
      categoryData.count.toString(),
      formatCurrency(categoryData.income) + ' ر.ق',
      formatCurrency(categoryData.expense) + ' ر.ق',
      formatCurrency(categoryData.income - categoryData.expense) + ' ر.ق'
    ]);

    return `
      <h2 class="section-header">📊 تحليل الفئات</h2>
      ${createDataTable(categoryHeaders, categoryRows)}
    `;
  })();

  return `
    ${summaryCards}
    
    ${analysisSection}
    
    ${alertsSection}
    
    ${categoryAnalysis}
    
    ${incomeSection}
    
    ${expenseSection}
  `;
}

/**
 * إنشاء محتوى تقرير العملاء
 */
async function generateCustomersReportContent(data: any[]): Promise<string> {
  const totalCustomers = data.length;
  const activeCustomers = data.filter(c => c.status === 'active').length;
  const inactiveCustomers = data.filter(c => c.status === 'inactive').length;

  const summaryCards = `
    <div class="summary-cards">
      ${createSummaryCard('إجمالي العملاء', totalCustomers, 'neutral', false, true)}
      ${createSummaryCard('العملاء النشطون', activeCustomers, 'positive', false, true)}
      ${createSummaryCard('العملاء غير النشطين', inactiveCustomers, 'warning', false, true)}
      ${createSummaryCard('معدل النشاط', totalCustomers > 0 ? (activeCustomers / totalCustomers * 100) : 0, 'neutral', true)}
    </div>
  `;

  const headers = ['الاسم الكامل', 'رقم الهاتف', 'الجنسية', 'رخصة القيادة', 'الحالة'];
  const rows = data.map(customer => [
    customer.full_name || 'غير محدد',
    customer.phone_number || 'غير محدد',
    customer.nationality || 'غير محدد',
    customer.driver_license || 'غير محدد',
    customer.status === 'active' ? '✅ نشط' : '❌ غير نشط'
  ]);

  return `
    ${summaryCards}
    
    <h2 class="section-header">👥 قائمة العملاء</h2>
    ${createDataTable(headers, rows)}
  `;
}

/**
 * إنشاء محتوى تقرير الصيانة
 */
async function generateMaintenanceReportContent(data: any[]): Promise<string> {
  const totalRecords = data.length;
  const completedRecords = data.filter(m => m.status === 'completed').length;
  const pendingRecords = data.filter(m => m.status === 'pending').length;
  const totalCost = data.reduce((sum, item) => sum + (item.cost || 0), 0);

  const summaryCards = `
    <div class="summary-cards">
      ${createSummaryCard('إجمالي أعمال الصيانة', totalRecords, 'neutral', false, true)}
      ${createSummaryCard('الأعمال المكتملة', completedRecords, 'positive', false, true)}
      ${createSummaryCard('الأعمال المعلقة', pendingRecords, 'warning', false, true)}
      ${createSummaryCard('إجمالي التكلفة', totalCost, 'neutral')}
    </div>
  `;

  const headers = ['المركبة', 'نوع الصيانة', 'التاريخ', 'التكلفة', 'الحالة'];
  const rows = data.map(maintenance => [
    maintenance.vehicle_info || 'غير محدد',
    maintenance.maintenance_type || 'غير محدد',
    maintenance.date ? formatDate(maintenance.date) : 'غير محدد',
    formatCurrency(maintenance.cost || 0) + ' ر.ق',
    maintenance.status === 'completed' ? '✅ مكتمل' : '⏳ معلق'
  ]);

  return `
    ${summaryCards}
    
    <h2 class="section-header">🔧 سجل الصيانة</h2>
    ${createDataTable(headers, rows)}
  `;
}

/**
 * إنشاء محتوى التقرير القانوني
 */
async function generateLegalReportContent(data: any[]): Promise<string> {
  const totalCases = data.length;
  const activeCases = data.filter(c => c.status === 'active').length;
  const closedCases = data.filter(c => c.status === 'closed').length;

  const summaryCards = `
    <div class="summary-cards">
      ${createSummaryCard('إجمالي القضايا', totalCases, 'neutral', false, true)}
      ${createSummaryCard('القضايا النشطة', activeCases, 'warning', false, true)}
      ${createSummaryCard('القضايا المغلقة', closedCases, 'positive', false, true)}
      ${createSummaryCard('نسبة الإنجاز', totalCases > 0 ? (closedCases / totalCases * 100) : 0, 'neutral', true)}
    </div>
  `;

  const headers = ['رقم القضية', 'نوع القضية', 'العميل', 'تاريخ الفتح', 'الحالة'];
  const rows = data.map(legalCase => [
    legalCase.case_number || 'غير محدد',
    legalCase.case_type || 'غير محدد',
    legalCase.customer_name || 'غير محدد',
    legalCase.created_date ? formatDate(legalCase.created_date) : 'غير محدد',
    legalCase.status === 'active' ? '🟡 نشطة' : '✅ مغلقة'
  ]);

  return `
    ${summaryCards}
    
    <h2 class="section-header">⚖️ القضايا القانونية</h2>
    ${createDataTable(headers, rows)}
  `;
}

/**
 * إنشاء محتوى تقرير عام
 */
async function generateGenericReportContent(data: any[], reportType: string): Promise<string> {
  if (data.length === 0) {
    return createHighlightBox('لا توجد بيانات متاحة لهذا التقرير', 'warning');
  }

  const headers = Object.keys(data[0]);
  const rows = data.map(item => Object.values(item).map(value => String(value || 'غير محدد')));

  return `
    <h2 class="section-header">📊 بيانات التقرير</h2>
    ${createDataTable(headers, rows)}
  `;
}

const ReportDownloadOptions: React.FC<ReportDownloadOptionsProps> = ({
  reportType,
  getReportData
}) => {
  const handleDownloadPDF = async () => {
    try {
      const data = getReportData();
      await generateModernReportPDF(reportType, data);
      toast.success('تم إنشاء التقرير بنجاح - يمكنك طباعته أو حفظه كـ PDF');
    } catch (error) {
      console.error('خطأ في إنشاء PDF:', error);
      toast.error('خطأ في إنشاء ملف PDF');
    }
  };

  const handleDownloadExcel = () => {
    try {
      let data = getReportData();
      if (!data || data.length === 0) {
        toast.error('لا توجد بيانات للتصدير');
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
      
      XLSX.writeFile(wb, `تقرير-${reportType}-${formatDate(new Date())}.xlsx`);
      toast.success('تم تنزيل تقرير Excel بنجاح');
    } catch (error) {
      console.error('خطأ في إنشاء Excel:', error);
      toast.error('خطأ في إنشاء ملف Excel');
    }
  };

  const handleDownloadCSV = () => {
    try {
      let data = getReportData();
      if (!data || data.length === 0) {
        toast.error('لا توجد بيانات للتصدير');
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
      link.setAttribute('download', `تقرير-${reportType.toLowerCase()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('تم تنزيل تقرير CSV بنجاح');
    } catch (error) {
      console.error('خطأ في إنشاء CSV:', error);
      toast.error('خطأ في إنشاء ملف CSV');
    }
  };

  return (
    <div className="flex gap-2 mb-4 flex-row-reverse" dir="rtl">
      <Button variant="outline" onClick={handleDownloadPDF}>
        <Download className="ml-2 h-4 w-4" />
        تصدير كـ PDF متطور
      </Button>
      <Button variant="outline" onClick={handleDownloadExcel}>
        <FileText className="ml-2 h-4 w-4" />
        تصدير كـ Excel
      </Button>
      <Button variant="outline" onClick={handleDownloadCSV}>
        <FileText className="ml-2 h-4 w-4" />
        تصدير كـ CSV
      </Button>
    </div>
  );
};

export default ReportDownloadOptions;
