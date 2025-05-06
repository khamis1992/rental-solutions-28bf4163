
import { Payment } from '@/components/agreements/PaymentHistory.types';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

interface PaymentWarningSectionProps {
  pendingPayments: Payment[];
  acknowledgedPayments: boolean;
  onAcknowledgePayments: (value: boolean) => void;
  isPaymentHistoryOpen: boolean;
  formatDate: (date: Date | undefined | string | null) => string;
}

export function PaymentWarningSection({
  pendingPayments,
  acknowledgedPayments,
  onAcknowledgePayments,
  isPaymentHistoryOpen,
  formatDate
}: PaymentWarningSectionProps) {
  if (pendingPayments.length === 0) return null;

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Overdue</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500">Pending</Badge>;
      default:
        return <Badge className="bg-slate-500">{status}</Badge>;
    }
  };

  return (
    <>
      {isPaymentHistoryOpen && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Payments</h4>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map((payment) => (
                  <tr key={payment.id} className="border-b">
                    <td className="p-2">{payment.amount} QAR</td>
                    <td className="p-2">{getStatusBadge(payment.status || '')}</td>
                    <td className="p-2">
                      {formatDate(payment.due_date || payment.original_due_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-2 border rounded-md p-3 bg-amber-50">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-medium">Pending Payments</h3>
        </div>
        <p className="text-sm mt-1 text-gray-600">
          There {pendingPayments.length === 1 ? 'is' : 'are'} {pendingPayments.length} pending {pendingPayments.length === 1 ? 'payment' : 'payments'} associated with this agreement.
        </p>
        <div className="mt-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledgedPayments}
              onChange={(e) => onAcknowledgePayments(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm">I acknowledge the pending payments</span>
          </label>
        </div>
      </div>
    </>
  );
}
