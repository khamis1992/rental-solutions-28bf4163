
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PaymentHistory } from '../../PaymentHistory';
import { CreditCard, Plus } from 'lucide-react';
import { useState } from 'react';
import { PaymentEntryDialog } from '../../PaymentEntryDialog';
import { Payment } from '@/types/payment.types';

interface PaymentManagementCardProps {
  agreement: any;
  payments: Payment[];
  isLoading: boolean;
  rentAmount: number | null;
  contractAmount: number | null;
  paymentMetrics: any;
  onPaymentDeleted: (paymentId: string) => void;
  onPaymentUpdated: (payment: Partial<Payment>) => Promise<boolean>;
  onRecordPayment: (payment: Partial<Payment>) => Promise<void>;
  fetchPayments: () => void;
  getDateString: (date: string | Date) => string;
}

export function PaymentManagementCard({
  agreement,
  payments,
  isLoading,
  rentAmount,
  contractAmount,
  paymentMetrics,
  onPaymentDeleted,
  onPaymentUpdated,
  onRecordPayment,
  fetchPayments,
  getDateString
}: PaymentManagementCardProps) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const handleRecordNewPayment = async (amount: number, date: Date, notes: string, method: string, reference: string) => {
    const payment: Partial<Payment> = {
      amount,
      payment_date: date.toISOString(),
      description: notes,
      payment_method: method,
      reference_number: reference,
      lease_id: agreement.id,
      status: 'paid'
    };
    await onRecordPayment(payment);
    setShowPaymentDialog(false);
    return true;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-row-reverse">
            <div className="text-right">
              <CardTitle className="flex items-center gap-2 flex-row-reverse">
                <CreditCard className="h-5 w-5" />
                إدارة المدفوعات
              </CardTitle>
              <CardDescription className="text-right mt-1">
                تتبع وإدارة جميع المدفوعات المتعلقة بهذا العقد
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowPaymentDialog(true)}
              className="flex items-center gap-2 flex-row-reverse"
            >
              <Plus className="h-4 w-4" />
              تسجيل دفعة
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Payment Summary Cards */}
      {paymentMetrics && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">إجمالي المدفوع</p>
                <p className="text-2xl font-bold text-green-600">
                  {paymentMetrics.totalPaid?.toLocaleString() || 0} ر.ق
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">المبلغ المتبقي</p>
                <p className="text-2xl font-bold text-orange-600">
                  {paymentMetrics.remainingAmount?.toLocaleString() || 0} ر.ق
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">عدد الدفعات</p>
                <p className="text-2xl font-bold text-blue-600">
                  {payments.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">سجل المدفوعات</CardTitle>
          <CardDescription className="text-right">
            جميع المدفوعات المسجلة لهذا العقد
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentHistory
            payments={payments}
            isLoading={isLoading}
            rentAmount={rentAmount}
            contractAmount={contractAmount}
            onPaymentDeleted={onPaymentDeleted}
            onPaymentUpdated={onPaymentUpdated}
            onRecordPayment={onRecordPayment}
            leaseStartDate={getDateString(agreement.start_date)}
            leaseEndDate={getDateString(agreement.end_date)}
            leaseId={agreement.id}
            agreement={agreement}
            fetchPayments={fetchPayments}
          />
        </CardContent>
      </Card>

      {/* Payment Entry Dialog */}
      {showPaymentDialog && (
        <PaymentEntryDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          onSubmit={handleRecordNewPayment}
          defaultAmount={rentAmount || 0}
          title="تسجيل دفعة جديدة"
          description="إضافة دفعة جديدة لهذا العقد"
          leaseId={agreement.id}
          rentAmount={rentAmount}
          selectedPayment={null}
        />
      )}
    </div>
  );
}
