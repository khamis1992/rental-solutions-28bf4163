import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { errorLogger } from '@/lib/errors/error-logger';
import { 
  generateUnifiedPDF, 
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
      content = await generateGenericReportContent(data);
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

  // Header رسمي مبسط
  const officialHeader = `
    <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 25px; page-break-inside: avoid;">
      <div style="border: 2px solid #333; padding: 15px; margin-bottom: 15px;">
        <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #333;">تقرير المخالفات المرورية</h1>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">نظام إدارة تأجير المركبات</p>
      </div>
      <div style="display: flex; justify-content: space-between; text-align: center; border-top: 1px solid #ddd; padding-top: 15px;">
        <div>
          <strong>تاريخ الإصدار:</strong> ${formatDate(new Date())}
        </div>
        <div>
          <strong>صالح لمدة:</strong> 30 يوماً من تاريخ الإصدار
        </div>
      </div>
    </div>
  `;

  // ملخص مبسط
  const simpleSummary = `
    <div style="border: 1px solid #ddd; padding: 15px; margin: 15px 0; page-break-inside: avoid;">
      <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #333; text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 10px;">الملخص التنفيذي</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 10px; font-weight: bold; width: 50%;">إجمالي المخالفات:</td>
          <td style="padding: 10px; text-align: left;"><strong>${totalFines}</strong> مخالفة</td>
        </tr>
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 10px; font-weight: bold;">المخالفات المسددة:</td>
          <td style="padding: 10px; text-align: left;"><strong>${paidFines}</strong> مخالفة</td>
        </tr>
        <tr style="border-bottom: 1px solid #ddd;">
          <td style="padding: 10px; font-weight: bold;">المخالفات المعلقة:</td>
          <td style="padding: 10px; text-align: left;"><strong>${pendingFines}</strong> مخالفة</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold;">إجمالي المبلغ:</td>
          <td style="padding: 10px; text-align: left;"><strong>${formatCurrency(totalAmount)}</strong> ريال قطري</td>
        </tr>
      </table>
      
      <div style="text-align: center; padding: 10px; background: #f5f5f5; border: 1px solid #ddd;">
        <strong>معدل السداد: ${totalFines > 0 ? ((paidFines / totalFines) * 100).toFixed(1) : 0}%</strong>
      </div>
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

  // جداول المخالفات لكل عميل مبسطة
  let customerTables = '';
  Object.entries(customerGroups).forEach(([customerName, customerFines], index) => {
    const customerTotal = customerFines.reduce((sum, fine) => {
      const amount = typeof fine.fineAmount === 'string' 
        ? parseFloat(fine.fineAmount.replace(/[^\d.-]/g, ''))
        : (fine.fineAmount || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const customerPaid = customerFines.filter(fine => fine.status === 'paid').length;
    const customerPending = customerFines.length - customerPaid;

    customerTables += `
      <div style="margin: 20px 0; page-break-inside: avoid; break-inside: avoid;">
        <div style="border: 2px solid #333; padding: 12px; margin-bottom: 1px; background: #f8f8f8;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="margin: 0; font-size: 16px; color: #333;">${customerName}</h3>
              <small style="color: #666;">عميل رقم ${index + 1}</small>
            </div>
            <div style="text-align: left;">
              <div style="font-weight: bold; font-size: 16px;">${formatCurrency(customerTotal)} ر.ق</div>
              <small style="color: #666;">${customerPaid} مسددة | ${customerPending} معلقة</small>
            </div>
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #333; font-size: 12px;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="border: 1px solid #333; padding: 8px; text-align: center;">رقم المخالفة</th>
              <th style="border: 1px solid #333; padding: 8px; text-align: center;">لوحة الترخيص</th>
              <th style="border: 1px solid #333; padding: 8px; text-align: center;">تاريخ المخالفة</th>
              <th style="border: 1px solid #333; padding: 8px; text-align: center;">نوع المخالفة</th>
              <th style="border: 1px solid #333; padding: 8px; text-align: center;">المبلغ</th>
              <th style="border: 1px solid #333; padding: 8px; text-align: center;">الحالة</th>
            </tr>
          </thead>
          <tbody>
    `;

    customerFines.forEach(fine => {
      customerTables += `
        <tr>
          <td style="border: 1px solid #333; padding: 6px; text-align: center;">${fine.violationNumber || 'غير محدد'}</td>
          <td style="border: 1px solid #333; padding: 6px; text-align: center;">${fine.licensePlate || 'غير محدد'}</td>
          <td style="border: 1px solid #333; padding: 6px; text-align: center;">${fine.violationDate ? formatDate(fine.violationDate) : 'غير محدد'}</td>
          <td style="border: 1px solid #333; padding: 6px; text-align: center;">${fine.violationType || 'غير محدد'}</td>
          <td style="border: 1px solid #333; padding: 6px; text-align: center;">${formatCurrency(fine.fineAmount || 0)} ر.ق</td>
          <td style="border: 1px solid #333; padding: 6px; text-align: center;">${fine.status === 'paid' ? 'مسددة ✓' : 'معلقة'}</td>
        </tr>
      `;
    });

    customerTables += `
          </tbody>
        </table>
      </div>
    `;
  });

  // ملاحظات مبسطة
  const simpleNotes = `
    <div style="border: 1px solid #333; padding: 15px; margin: 20px 0; page-break-inside: avoid;">
      <h2 style="margin: 0 0 15px 0; font-size: 16px; color: #333; text-align: center; border-bottom: 1px solid #333; padding-bottom: 8px;">ملاحظات هامة</h2>
      
      <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
        <div style="width: 48%;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #333;">إحصائيات التقرير:</h4>
          <ul style="margin: 0; padding-right: 15px; font-size: 12px; line-height: 1.6;">
            <li>عدد العملاء: ${Object.keys(customerGroups).length} عميل</li>
            <li>متوسط المخالفات لكل عميل: ${(totalFines / Math.max(Object.keys(customerGroups).length, 1)).toFixed(1)} مخالفة</li>
            <li>إجمالي المبلغ المطلوب: ${formatCurrency(totalAmount)} ريال قطري</li>
          </ul>
        </div>
        
        <div style="width: 48%;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #333;">الإجراءات المطلوبة:</h4>
          ${pendingFines > 0 ? `
            <ul style="margin: 0; padding-right: 15px; font-size: 12px; line-height: 1.6;">
              <li>متابعة سداد ${pendingFines} مخالفة معلقة</li>
              <li>التواصل مع العملاء لتحديد مواعيد السداد</li>
              <li>المراجعة الدورية لحالة المخالفات</li>
            </ul>
          ` : `
            <p style="margin: 0; font-size: 12px; color: #333;">جميع المخالفات مسددة. لا توجد إجراءات مطلوبة حالياً.</p>
          `}
        </div>
      </div>
      
      <div style="border-top: 1px solid #ddd; padding-top: 15px; font-size: 11px; line-height: 1.5; color: #666;">
        <h4 style="margin: 0 0 8px 0; font-size: 12px; color: #333; text-align: center;">بنود قانونية مهمة:</h4>
        <p style="margin: 0 0 5px 0;"><strong>1.</strong> هذا التقرير صادر من نظام إدارة تأجير المركبات ويعتبر وثيقة رسمية لأغراض المتابعة الإدارية.</p>
        <p style="margin: 0 0 5px 0;"><strong>2.</strong> جميع البيانات الواردة في هذا التقرير محدثة حتى تاريخ الإصدار المذكور أعلاه.</p>
        <p style="margin: 0;"><strong>3.</strong> في حالة وجود استفسارات، يرجى التواصل مع قسم المخالفات المرورية في الشركة.</p>
      </div>
    </div>
  `;

  return `
    ${officialHeader}
    ${simpleSummary}
    
    <div style="page-break-inside: avoid;">
      <h2 style="margin: 20px 0 15px 0; font-size: 18px; color: #333; text-align: center; border-bottom: 2px solid #333; padding-bottom: 8px;">تفاصيل المخالفات حسب العميل</h2>
      ${customerTables}
    </div>
    
    ${simpleNotes}
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
async function generateGenericReportContent(data: any[]): Promise<string> {
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
      const data = getReportData();
      errorLogger.logError(error as Error, 'medium', {
        context: 'ReportDownloadOptions.handleDownloadPDF',
        details: { reportType, dataCount: data?.length || 0 }
      });
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
      const reportData = getReportData();
      errorLogger.logError(error as Error, 'medium', {
        context: 'ReportDownloadOptions.handleDownloadExcel',
        details: { reportType, dataCount: reportData?.length || 0 }
      });
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
      const reportData = getReportData();
      errorLogger.logError(error as Error, 'medium', {
        context: 'ReportDownloadOptions.handleDownloadCSV',
        details: { reportType, dataCount: reportData?.length || 0 }
      });
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
