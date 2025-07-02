import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { applyRTLPrintLayout } from '@/utils/rtl-advanced-features';
import { formatQatarRiyal, formatArabicDate } from '@/utils/arabic-rtl-utils';
import { Button } from '@/components/ui/button';
import { Printer, Download, FileText } from 'lucide-react';

interface RTLPrintLayoutProps {
  children: React.ReactNode;
  layoutType: 'invoice' | 'report' | 'agreement' | 'base';
  className?: string;
  title?: string;
  subtitle?: string;
  showPrintButton?: boolean;
  showDownloadButton?: boolean;
  onPrint?: () => void;
  onDownload?: () => void;
}

/**
 * RTL Print Layout Container
 */
export const RTLPrintLayout: React.FC<RTLPrintLayoutProps> = ({
  children,
  layoutType,
  className,
  title,
  subtitle,
  showPrintButton = true,
  showDownloadButton = false,
  onPrint,
  onDownload,
}) => {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Apply RTL print styles
    cleanupRef.current = applyRTLPrintLayout(layoutType);

    return () => {
      // Cleanup styles on unmount
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [layoutType]);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    }
  };

  return (
    <div className={cn('rtl-print-container', className)} dir="rtl">
      {/* Print Controls (hidden in print) */}
      <div className="print-hidden mb-6 flex items-center justify-between">
        <div>
          {title && (
            <h1 className="text-2xl font-bold text-gray-900 text-right mb-1">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-gray-600 text-right">
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {showDownloadButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              تحميل
            </Button>
          )}
          {showPrintButton && (
            <Button
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              طباعة
            </Button>
          )}
        </div>
      </div>

      {/* Print Content */}
      <div className="rtl-print-content">
        {children}
      </div>
    </div>
  );
};

/**
 * RTL Invoice Print Layout
 */
interface RTLInvoicePrintProps {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email?: string;
    taxId?: string;
  };
  customerInfo: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  notes?: string;
  terms?: string;
  className?: string;
}

export const RTLInvoicePrint: React.FC<RTLInvoicePrintProps> = ({
  invoiceNumber,
  invoiceDate,
  dueDate,
  companyInfo,
  customerInfo,
  items,
  subtotal,
  tax = 0,
  discount = 0,
  total,
  notes,
  terms,
  className,
}) => {
  return (
    <RTLPrintLayout layoutType="invoice" className={className}>
      {/* Invoice Header */}
      <div className="invoice-header mb-8">
        <div className="flex justify-between items-start">
          <div className="text-right">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">فاتورة</h1>
            <div className="text-sm text-gray-600 space-y-1">
              <div>رقم الفاتورة: <span className="font-semibold">{invoiceNumber}</span></div>
              <div>تاريخ الفاتورة: <span className="font-semibold">{formatArabicDate(new Date(invoiceDate))}</span></div>
              {dueDate && (
                <div>تاريخ الاستحقاق: <span className="font-semibold">{formatArabicDate(new Date(dueDate))}</span></div>
              )}
            </div>
          </div>
          <div className="text-left">
            <div className="text-lg font-bold text-gray-900 mb-2">{companyInfo.name}</div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>{companyInfo.address}</div>
              <div>هاتف: {companyInfo.phone}</div>
              {companyInfo.email && <div>بريد إلكتروني: {companyInfo.email}</div>}
              {companyInfo.taxId && <div>الرقم الضريبي: {companyInfo.taxId}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="invoice-details mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 text-right">معلومات العميل</h3>
          <div className="text-right space-y-1">
            <div className="font-semibold">{customerInfo.name}</div>
            <div>{customerInfo.address}</div>
            {customerInfo.phone && <div>هاتف: {customerInfo.phone}</div>}
            {customerInfo.email && <div>بريد إلكتروني: {customerInfo.email}</div>}
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="mb-8">
        <table className="invoice-table w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-right p-3 font-semibold">الوصف</th>
              <th className="text-center p-3 font-semibold">الكمية</th>
              <th className="text-center p-3 font-semibold">سعر الوحدة</th>
              <th className="text-center p-3 font-semibold">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="text-right p-3">{item.description}</td>
                <td className="text-center p-3">{item.quantity}</td>
                <td className="text-center p-3">{formatQatarRiyal(item.unitPrice)}</td>
                <td className="text-center p-3 font-semibold">{formatQatarRiyal(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invoice Totals */}
      <div className="invoice-total">
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span>المجموع الفرعي:</span>
              <span className="font-semibold">{formatQatarRiyal(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between py-2 border-b text-green-600">
                <span>الخصم:</span>
                <span className="font-semibold">-{formatQatarRiyal(discount)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between py-2 border-b">
                <span>الضريبة:</span>
                <span className="font-semibold">{formatQatarRiyal(tax)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 border-t-2 border-gray-900 text-lg font-bold">
              <span>الإجمالي النهائي:</span>
              <span>{formatQatarRiyal(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes and Terms */}
      {(notes || terms) && (
        <div className="mt-8 space-y-4">
          {notes && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 text-right">ملاحظات:</h4>
              <p className="text-sm text-gray-600 text-right">{notes}</p>
            </div>
          )}
          {terms && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 text-right">الشروط والأحكام:</h4>
              <p className="text-sm text-gray-600 text-right">{terms}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-6 border-t text-center text-sm text-gray-500">
        <p>شكراً لتعاملكم معنا</p>
        <p className="mt-1">تم إنشاء هذه الفاتورة بتاريخ {formatArabicDate(new Date())}</p>
      </div>
    </RTLPrintLayout>
  );
};

/**
 * RTL Report Print Layout
 */
interface RTLReportPrintProps {
  title: string;
  subtitle?: string;
  reportDate: string;
  generatedBy?: string;
  data: Array<{
    [key: string]: any;
  }>;
  columns: Array<{
    key: string;
    label: string;
    align?: 'right' | 'center' | 'left';
    format?: (value: any) => string;
  }>;
  summary?: Array<{
    label: string;
    value: string | number;
    highlight?: boolean;
  }>;
  className?: string;
}

export const RTLReportPrint: React.FC<RTLReportPrintProps> = ({
  title,
  subtitle,
  reportDate,
  generatedBy,
  data,
  columns,
  summary,
  className,
}) => {
  return (
    <RTLPrintLayout layoutType="report" className={className}>
      {/* Report Header */}
      <div className="report-header mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        {subtitle && (
          <p className="text-lg text-gray-600 mb-4">{subtitle}</p>
        )}
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div>تاريخ التقرير: {formatArabicDate(new Date(reportDate))}</div>
          {generatedBy && <div>تم الإنشاء بواسطة: {generatedBy}</div>}
        </div>
      </div>

      {/* Report Data */}
      <div className="report-section mb-8">
        <table className="report-table w-full">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={cn(
                    'p-3 font-semibold bg-gray-100 border',
                    column.align === 'center' ? 'text-center' : 
                    column.align === 'left' ? 'text-left' : 'text-right'
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b">
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      'p-3 border',
                      column.align === 'center' ? 'text-center' : 
                      column.align === 'left' ? 'text-left' : 'text-right'
                    )}
                  >
                    {column.format ? column.format(row[column.key]) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Report Summary */}
      {summary && summary.length > 0 && (
        <div className="report-summary">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-right">ملخص التقرير</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary.map((item, index) => (
              <div
                key={index}
                className={cn(
                  'p-4 rounded-lg border text-right',
                  item.highlight ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                )}
              >
                <div className="text-sm text-gray-600 mb-1">{item.label}</div>
                <div className={cn(
                  'text-lg font-semibold',
                  item.highlight ? 'text-blue-900' : 'text-gray-900'
                )}>
                  {typeof item.value === 'number' ? formatQatarRiyal(item.value) : item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-6 border-t text-center text-sm text-gray-500">
        <p>تم إنشاء هذا التقرير بتاريخ {formatArabicDate(new Date())}</p>
        {generatedBy && <p className="mt-1">بواسطة: {generatedBy}</p>}
      </div>
    </RTLPrintLayout>
  );
};

/**
 * RTL Agreement Print Layout
 */
interface RTLAgreementPrintProps {
  agreementNumber: string;
  agreementDate: string;
  parties: {
    firstParty: {
      name: string;
      address: string;
      phone?: string;
      idNumber?: string;
    };
    secondParty: {
      name: string;
      address: string;
      phone?: string;
      idNumber?: string;
    };
  };
  terms: string[];
  amount?: number;
  duration?: string;
  startDate?: string;
  endDate?: string;
  signatures?: {
    firstParty: string;
    secondParty: string;
    witness?: string;
  };
  className?: string;
}

export const RTLAgreementPrint: React.FC<RTLAgreementPrintProps> = ({
  agreementNumber,
  agreementDate,
  parties,
  terms,
  amount,
  duration,
  startDate,
  endDate,
  signatures,
  className,
}) => {
  return (
    <RTLPrintLayout layoutType="agreement" className={className}>
      {/* Agreement Header */}
      <div className="agreement-header mb-8">
        <h1 className="text-2xl font-bold text-gray-900">عقد إيجار مركبة</h1>
        <div className="mt-4 text-sm text-gray-600 text-center">
          <div>رقم العقد: {agreementNumber}</div>
          <div>تاريخ العقد: {formatArabicDate(new Date(agreementDate))}</div>
        </div>
      </div>

      {/* Parties Information */}
      <div className="agreement-parties mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-right">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">الطرف الأول (المؤجر)</h3>
            <div className="space-y-2 text-sm">
              <div><strong>الاسم:</strong> {parties.firstParty.name}</div>
              <div><strong>العنوان:</strong> {parties.firstParty.address}</div>
              {parties.firstParty.phone && (
                <div><strong>الهاتف:</strong> {parties.firstParty.phone}</div>
              )}
              {parties.firstParty.idNumber && (
                <div><strong>رقم الهوية:</strong> {parties.firstParty.idNumber}</div>
              )}
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">الطرف الثاني (المستأجر)</h3>
            <div className="space-y-2 text-sm">
              <div><strong>الاسم:</strong> {parties.secondParty.name}</div>
              <div><strong>العنوان:</strong> {parties.secondParty.address}</div>
              {parties.secondParty.phone && (
                <div><strong>الهاتف:</strong> {parties.secondParty.phone}</div>
              )}
              {parties.secondParty.idNumber && (
                <div><strong>رقم الهوية:</strong> {parties.secondParty.idNumber}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Agreement Details */}
      {(amount || duration || startDate || endDate) && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 text-right">تفاصيل العقد</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {amount && (
              <div className="text-right">
                <strong>قيمة الإيجار:</strong> {formatQatarRiyal(amount)}
              </div>
            )}
            {duration && (
              <div className="text-right">
                <strong>مدة العقد:</strong> {duration}
              </div>
            )}
            {startDate && (
              <div className="text-right">
                <strong>تاريخ البداية:</strong> {formatArabicDate(new Date(startDate))}
              </div>
            )}
            {endDate && (
              <div className="text-right">
                <strong>تاريخ النهاية:</strong> {formatArabicDate(new Date(endDate))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agreement Terms */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-right">شروط العقد</h3>
        <div className="space-y-3">
          {terms.map((term, index) => (
            <div key={index} className="agreement-terms flex text-sm">
              <span className="ml-3 font-semibold">{index + 1}.</span>
              <span>{term}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Signatures */}
      <div className="agreement-signatures mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-center">
            <div className="signature-box mb-4">
              {signatures?.firstParty || 'توقيع الطرف الأول'}
            </div>
            <div className="text-sm font-semibold">الطرف الأول (المؤجر)</div>
            <div className="text-sm text-gray-600">{parties.firstParty.name}</div>
          </div>
          <div className="text-center">
            <div className="signature-box mb-4">
              {signatures?.secondParty || 'توقيع الطرف الثاني'}
            </div>
            <div className="text-sm font-semibold">الطرف الثاني (المستأجر)</div>
            <div className="text-sm text-gray-600">{parties.secondParty.name}</div>
          </div>
        </div>
        
        {signatures?.witness && (
          <div className="text-center mt-8">
            <div className="signature-box mb-4 mx-auto" style={{ width: '200px' }}>
              {signatures.witness}
            </div>
            <div className="text-sm font-semibold">الشاهد</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t text-center text-sm text-gray-500">
        <p>تم إنشاء هذا العقد بتاريخ {formatArabicDate(new Date())}</p>
        <p className="mt-1">جميع الحقوق محفوظة</p>
      </div>
    </RTLPrintLayout>
  );
};

/**
 * Export all RTL print components
 */
export {
  RTLPrintLayout as PrintLayout,
  RTLInvoicePrint as InvoicePrint,
  RTLReportPrint as ReportPrint,
  RTLAgreementPrint as AgreementPrint,
}; 