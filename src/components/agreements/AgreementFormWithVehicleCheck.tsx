import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { PaymentWarningSection } from './vehicle-assignment/PaymentWarningSection';
import { formatDate } from '@/lib/date-utils';

interface AgreementFormWithVehicleCheckProps {
  onSubmit: (data: any) => Promise<void> | void;
  isSubmitting: boolean;
  standardTemplateExists?: boolean;
  isCheckingTemplate?: boolean;
}

// A selection of the most important options for agreements
const statusOptions = [
  { value: 'active', label: 'نشط' },
  { value: 'pending', label: 'معلق' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغي' },
  { value: 'on_hold', label: 'في الانتظار' },
  { value: 'in_negotiation', label: 'قيد التفاوض' },
  { value: 'expired', label: 'منتهي الصلاحية' },
  { value: 'terminated', label: 'منتهي' },
  { value: 'breached', label: 'مخل' },
  { value: 'renewed', label: 'مجدد' },
];

const paymentFrequencyOptions = [
  { value: 'weekly', label: 'أسبوعي' },
  { value: 'biweekly', label: 'كل أسبوعين' },
  { value: 'monthly', label: 'شهري' },
  { value: 'quarterly', label: 'ربع سنوي' },
  { value: 'annually', label: 'سنوي' },
  { value: 'one_time', label: 'دفعة واحدة' },
];

const agreementTypeOptions = [
  { value: 'lease', label: 'إيجار' },
  { value: 'rental', label: 'تأجير' },
  { value: 'service', label: 'خدمة' },
  { value: 'sales', label: 'مبيعات' },
  { value: 'partnership', label: 'شراكة' },
  { value: 'other', label: 'أخرى' },
];

// Define the actual component with a minimal implementation
const AgreementFormWithVehicleCheck = ({ 
  onSubmit, 
  isSubmitting, 
  standardTemplateExists = false, 
  isCheckingTemplate = false 
}: AgreementFormWithVehicleCheckProps) => {
  const [formData, setFormData] = useState({
    agreement_type: 'lease',
    status: 'pending',
    payment_frequency: 'monthly',
  });
  
  const [acknowledgedPayments, setAcknowledgedPayments] = useState(false);
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);
  
  const mockPendingPayments = [
    {
      id: '1',
      amount: 500,
      status: 'pending',
      due_date: new Date().toISOString(),
    }
  ];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (isCheckingTemplate) {
    return (
      <div className="flex justify-center items-center py-12" dir="rtl">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-right">جاري فحص توفر القالب...</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl">
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-right">تفاصيل الاتفاقية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Agreement type and status would go here */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">
                    نوع الاتفاقية
                  </label>
                  <select 
                    className="w-full border rounded px-3 py-2 text-right" 
                    value={formData.agreement_type}
                    onChange={(e) => setFormData({...formData, agreement_type: e.target.value})}
                    dir="rtl"
                  >
                    {agreementTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-right">
                    الحالة
                  </label>
                  <select 
                    className="w-full border rounded px-3 py-2 text-right"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    dir="rtl"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-right">تفاصيل الدفع</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-right">
                  تكرار الدفع
                </label>
                <select 
                  className="w-full border rounded px-3 py-2 text-right"
                  value={formData.payment_frequency}
                  onChange={(e) => setFormData({...formData, payment_frequency: e.target.value})}
                  dir="rtl"
                >
                  {paymentFrequencyOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-6">
              <Button 
                type="button"
                variant="outline"
                onClick={() => setIsPaymentHistoryOpen(!isPaymentHistoryOpen)}
                className="mb-4"
              >
                {isPaymentHistoryOpen ? 'إخفاء' : 'عرض'} جدولة الدفعات
              </Button>
              
              <PaymentWarningSection
                pendingPayments={mockPendingPayments}
                acknowledgedPayments={acknowledgedPayments}
                onAcknowledgePayments={setAcknowledgedPayments}
                isPaymentHistoryOpen={isPaymentHistoryOpen}
                formatDate={(date) => formatDate(new Date(date))}
              />
            </div>
          </CardContent>
        </Card>

        {!standardTemplateExists && (
          <div className="bg-yellow-50 border-r-4 border-yellow-400 p-4 mb-6" dir="rtl">
            <div className="flex flex-row-reverse">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="mr-3">
                <p className="text-sm text-yellow-700 text-right">
                  لم يتم العثور على قالب الاتفاقية. قد تكون بعض الميزات محدودة.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-reverse space-x-4 mt-6 flex-row-reverse">
          <Button variant="outline" type="button">
            إلغاء
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="ml-2" size="sm" /> : null}
            {isSubmitting ? 'جاري الحفظ...' : 'حفظ الاتفاقية'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AgreementFormWithVehicleCheck;
