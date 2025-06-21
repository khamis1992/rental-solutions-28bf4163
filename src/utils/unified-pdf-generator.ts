/**
 * نظام إنشاء PDF موحد ومتطور
 * يستخدم HTML-based generation للحصول على دعم أفضل للعربية و RTL
 * 
 * المزايا:
 * - دعم كامل للعربية و RTL
 * - تصميم مرن وقابل للتخصيص
 * - لا توجد مشاكل في الخطوط
 * - معاينة مباشرة قبل الطباعة
 * - سهولة التطوير والصيانة
 */

import { formatCurrency, formatDate } from '@/lib/utils';
import { formatArabicDate } from '@/utils/arabic-rtl-utils';
import { toast } from 'sonner';

export interface PDFConfig {
  title: string;
  filename: string;
  orientation?: 'portrait' | 'landscape';
  includeHeader?: boolean;
  includeFooter?: boolean;
  companyInfo?: boolean;
  rtl?: boolean;
}

export interface PDFStyles {
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: string;
}

/**
 * الأنماط الافتراضية للنظام
 */
const DEFAULT_STYLES: PDFStyles = {
  primaryColor: '#1f2937',
  secondaryColor: '#6b7280',
  backgroundColor: '#f9fafb',
  fontFamily: "'Segoe UI', 'Tahoma', 'Arial', sans-serif",
  fontSize: '14px'
};

/**
 * إنشاء CSS متقدم للطباعة
 */
function generatePrintCSS(styles: PDFStyles = DEFAULT_STYLES): string {
  return `
    <style>
      @page {
        size: A4;
        margin: 20mm;
      }
      
      * {
        box-sizing: border-box;
      }
      
      body {
        font-family: ${styles.fontFamily};
        direction: rtl;
        text-align: right;
        margin: 0;
        padding: 20px;
        line-height: 1.8;
        color: ${styles.primaryColor};
        background: white;
        font-size: ${styles.fontSize};
      }
      
      .company-header {
        text-align: center;
        font-size: 22px;
        font-weight: bold;
        margin: 20px 0;
        color: ${styles.primaryColor};
        border-bottom: 3px solid ${styles.primaryColor};
        padding-bottom: 15px;
      }
      
      .document-title {
        text-align: center;
        font-size: 20px;
        font-weight: bold;
        margin: 30px 0;
        color: ${styles.primaryColor};
        background: ${styles.backgroundColor};
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .section-header {
        font-size: 18px;
        font-weight: bold;
        margin: 25px 0 15px 0;
        color: ${styles.primaryColor};
        border-right: 4px solid ${styles.primaryColor};
        padding-right: 15px;
        background: ${styles.backgroundColor};
        padding: 10px 15px;
        border-radius: 5px;
      }
      
      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        margin: 20px 0;
      }
      
      .info-card {
        background: ${styles.backgroundColor};
        border: 2px solid ${styles.primaryColor};
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .info-card h3 {
        margin: 0 0 15px 0;
        color: ${styles.primaryColor};
        font-size: 16px;
        border-bottom: 2px solid ${styles.primaryColor};
        padding-bottom: 8px;
      }
      
      .field-row {
        display: flex;
        justify-content: space-between;
        margin: 8px 0;
        padding: 5px 0;
        border-bottom: 1px dotted ${styles.secondaryColor};
      }
      
      .field-label {
        font-weight: bold;
        color: ${styles.secondaryColor};
        min-width: 120px;
      }
      
      .field-value {
        color: ${styles.primaryColor};
        text-align: left;
      }
      
      .data-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border-radius: 8px;
        overflow: hidden;
      }
      
      .data-table th {
        background: ${styles.primaryColor};
        color: white;
        padding: 12px 8px;
        text-align: center;
        font-weight: bold;
        font-size: 13px;
      }
      
      .data-table td {
        border: 1px solid #e5e7eb;
        padding: 10px 8px;
        text-align: center;
        font-size: 12px;
      }
      
      .data-table tbody tr:nth-child(even) {
        background-color: #f9fafb;
      }
      
      .data-table tbody tr:hover {
        background-color: #f3f4f6;
      }
      
      .summary-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin: 20px 0;
      }
      
      .summary-card {
        background: white;
        border: 2px solid ${styles.primaryColor};
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .summary-card h4 {
        margin: 0 0 10px 0;
        color: ${styles.secondaryColor};
        font-size: 14px;
      }
      
      .summary-card .amount {
        font-size: 24px;
        font-weight: bold;
        color: ${styles.primaryColor};
      }
      
      .summary-card.positive .amount {
        color: #16a34a;
      }
      
      .summary-card.negative .amount {
        color: #dc2626;
      }
      
      .summary-card.warning .amount {
        color: #f59e0b;
      }
      
      .highlight-box {
        background: #fff3cd;
        border: 2px solid #ffc107;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
        border-right: 6px solid #ffc107;
      }
      
      .alert-box {
        background: #fee2e2;
        border: 2px solid #dc2626;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
        border-right: 6px solid #dc2626;
      }
      
      .success-box {
        background: #dcfce7;
        border: 2px solid #16a34a;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
        border-right: 6px solid #16a34a;
      }
      
      .footer {
        margin-top: 40px;
        text-align: center;
        font-size: 12px;
        color: ${styles.secondaryColor};
        border-top: 2px solid ${styles.primaryColor};
        padding-top: 20px;
      }
      
      .signature-section {
        margin-top: 60px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 40px;
      }
      
      .signature-box {
        text-align: center;
        border: 2px solid ${styles.primaryColor};
        border-radius: 8px;
        padding: 30px 20px;
        min-height: 120px;
      }
      
      .signature-box h4 {
        margin: 0 0 10px 0;
        color: ${styles.primaryColor};
      }
      
      .print-controls {
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 1000;
        display: flex;
        gap: 10px;
      }
      
      .print-button {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: all 0.2s;
      }
      
      .print-button:hover {
        background: #2563eb;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      }
      
      .print-button.secondary {
        background: #6b7280;
      }
      
      .print-button.secondary:hover {
        background: #4b5563;
      }
      
      @media print {
        body { 
          print-color-adjust: exact; 
          -webkit-print-color-adjust: exact;
        }
        .print-controls { 
          display: none !important; 
        }
        .info-grid {
          grid-template-columns: 1fr 1fr;
        }
        .summary-cards {
          grid-template-columns: repeat(3, 1fr);
        }
      }
      
      /* تحسينات للشاشات الصغيرة */
      @media (max-width: 768px) {
        .info-grid {
          grid-template-columns: 1fr;
        }
        .summary-cards {
          grid-template-columns: 1fr;
        }
        .signature-section {
          grid-template-columns: 1fr;
        }
      }
    </style>
  `;
}

/**
 * إنشاء رأس الشركة
 */
function generateCompanyHeader(): string {
  return `
    <div class="company-header">
      🏢 شركة العراف لتأجير السيارات
      <div style="font-size: 14px; margin-top: 10px; color: #6b7280;">
        أم صلال، منطقة 71، مبنى 79، الشارع التجاري - دولة قطر
      </div>
    </div>
  `;
}

/**
 * إنشاء تذييل الصفحة
 */
function generateFooter(): string {
  const currentDate = formatArabicDate(new Date());
  return `
    <div class="footer">
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 15px;">
        <div>تاريخ الإنشاء: ${currentDate}</div>
        <div>نظام إدارة تأجير المركبات</div>
        <div>مؤتمت بالكامل</div>
      </div>
      <div style="font-size: 10px; color: #9ca3af;">
        هذا التقرير تم إنشاؤه تلقائياً من النظام - جميع البيانات محدثة ومؤكدة
      </div>
    </div>
  `;
}

/**
 * إنشاء أزرار التحكم في الطباعة
 */
function generatePrintControls(): string {
  return `
    <div class="print-controls">
      <button class="print-button" onclick="window.print()">
        🖨️ طباعة / حفظ PDF
      </button>
      <button class="print-button secondary" onclick="window.close()">
        ❌ إغلاق
      </button>
    </div>
  `;
}

/**
 * الدالة الرئيسية لإنشاء PDF موحد
 */
export async function generateUnifiedPDF({
  config,
  content,
  styles = DEFAULT_STYLES
}: {
  config: PDFConfig;
  content: string;
  styles?: PDFStyles;
}): Promise<void> {
  try {
    // دمج الأنماط مع الافتراضية
    const mergedStyles = { ...DEFAULT_STYLES, ...styles };
    
    // إنشاء HTML كامل
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="${config.rtl !== false ? 'rtl' : 'ltr'}" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${config.title}</title>
        ${generatePrintCSS(mergedStyles)}
      </head>
      <body>
        ${generatePrintControls()}
        
        ${config.companyInfo !== false ? generateCompanyHeader() : ''}
        
        <div class="document-title">
          ${config.title}
        </div>
        
        ${content}
        
        ${config.includeFooter !== false ? generateFooter() : ''}
      </body>
      </html>
    `;

    console.log('Opening PDF window...');

    // محاولة فتح نافذة منبثقة
    const printWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
    
    if (!printWindow) {
      console.warn('Popup blocked, using alternative method...');
      // طريقة بديلة: تحميل ملف HTML
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${config.filename}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('تم تحميل ملف HTML - يمكنك فتحه وطباعته كـ PDF');
    } else {
      console.log('Popup window opened successfully');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // تركيز النافذة وتشغيل الطباعة
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 1000);
      
      toast.success('تم فتح نافذة الطباعة - يمكنك حفظ التقرير كـ PDF');
    }
    
  } catch (error) {
    console.error('Error generating unified PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    toast.error(`فشل في إنشاء التقرير: ${errorMessage}`);
    throw error;
  }
}

/**
 * دوال مساعدة لإنشاء عناصر HTML
 */

export function createInfoCard(title: string, fields: { label: string; value: string }[]): string {
  return `
    <div class="info-card">
      <h3>${title}</h3>
      ${fields.map(field => `
        <div class="field-row">
          <span class="field-label">${field.label}:</span>
          <span class="field-value">${field.value}</span>
        </div>
      `).join('')}
    </div>
  `;
}

export function createSummaryCard(title: string, amount: number, type: 'positive' | 'negative' | 'warning' | 'neutral' = 'neutral'): string {
  return `
    <div class="summary-card ${type}">
      <h4>${title}</h4>
      <div class="amount">${formatCurrency(amount)} ر.ق</div>
    </div>
  `;
}

export function createDataTable(headers: string[], rows: string[][]): string {
  return `
    <table class="data-table">
      <thead>
        <tr>
          ${headers.map(header => `<th>${header}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr>
            ${row.map(cell => `<td>${cell}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

export function createHighlightBox(content: string, type: 'warning' | 'alert' | 'success' = 'warning'): string {
  const className = type === 'warning' ? 'highlight-box' : 
                   type === 'alert' ? 'alert-box' : 'success-box';
  
  return `
    <div class="${className}">
      ${content}
    </div>
  `;
}

export function createSignatureSection(): string {
  return `
    <div style="page-break-before: always; margin-top: 100px;">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 25px; text-align: center; margin: 50px 0; border-radius: 15px; box-shadow: 0 8px 25px rgba(30, 58, 138, 0.3);">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">📝 التوقيعات والمصادقة</h1>
        <p style="margin: 15px 0 0 0; font-size: 16px;">إقرار الطرفين بقراءة العقد وفهم جميع البنود والموافقة عليها</p>
      </div>
      
      <div style="background: #fef2f2; border: 3px solid #dc2626; padding: 25px; margin: 30px 0; border-radius: 12px; text-align: center;">
        <h3 style="color: #dc2626; margin: 0 0 15px 0; font-size: 18px;">⚠️ إقرار مهم</h3>
        <p style="margin: 0; font-size: 16px; line-height: 1.8; color: #1f2937;">
          بتوقيعي أسفله، أقر بأنني قد قرأت جميع بنود وشروط هذا العقد بعناية وفهمتها جيداً، 
          وأوافق على جميع ما ورد فيها، وأتعهد بالالتزام الكامل بجميع البنود والشروط المذكورة.
        </p>
      </div>
      
      <div class="signature-section" style="margin-top: 60px;">
        <div class="signature-box" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 3px solid #1e3a8a; border-radius: 15px; padding: 40px 20px; min-height: 180px; text-align: center; box-shadow: 0 6px 20px rgba(30, 58, 138, 0.2);">
          <h4 style="color: #1e3a8a; font-size: 18px; margin: 0 0 20px 0; font-weight: bold;">👤 توقيع العميل (الطرف الثاني)</h4>
          <div style="margin: 50px 0 20px 0; border-bottom: 3px solid #1e3a8a; width: 80%; margin-left: auto; margin-right: auto;"></div>
          <div style="margin-top: 20px;">
            <div style="font-size: 14px; color: #64748b; margin: 10px 0;">الاسم: ________________________</div>
            <div style="font-size: 14px; color: #64748b; margin: 10px 0;">التاريخ: ________________________</div>
          </div>
        </div>
        
        <div class="signature-box" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 3px solid #16a34a; border-radius: 15px; padding: 40px 20px; min-height: 180px; text-align: center; box-shadow: 0 6px 20px rgba(22, 163, 74, 0.2);">
          <h4 style="color: #16a34a; font-size: 18px; margin: 0 0 20px 0; font-weight: bold;">🏢 توقيع ممثل الشركة (الطرف الأول)</h4>
          <div style="margin: 50px 0 20px 0; border-bottom: 3px solid #16a34a; width: 80%; margin-left: auto; margin-right: auto;"></div>
          <div style="margin-top: 20px;">
            <div style="font-size: 14px; color: #64748b; margin: 10px 0;">الاسم: ________________________</div>
            <div style="font-size: 14px; color: #64748b; margin: 10px 0;">التاريخ: ________________________</div>
            <div style="font-size: 14px; color: #64748b; margin: 10px 0;">الختم: ________________________</div>
          </div>
        </div>
      </div>
      
      <div style="background: #f8fafc; border: 2px solid #64748b; padding: 20px; margin: 40px 0; border-radius: 10px; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">
          <strong>ملاحظة قانونية:</strong> هذا العقد محرر باللغة العربية ومطابق لقوانين دولة قطر النافذة. 
          أي تعديل على هذا العقد يجب أن يكون كتابياً وموقعاً من الطرفين.
        </p>
      </div>
    </div>
  `;
}

/**
 * تصدير دوال مساعدة للاستخدام المباشر
 */
export {
  formatCurrency,
  formatDate,
  formatArabicDate
}; 