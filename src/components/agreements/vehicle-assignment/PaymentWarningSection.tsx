
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  status: string;
  description?: string;
  payment_method?: string;
}

interface PaymentWarningSectionProps {
  pendingPayments: Payment[];
  acknowledgedPayments: boolean;
  onAcknowledgePayments: (acknowledged: boolean) => void;
  isPaymentHistoryOpen: boolean;
  formatDate: (date: string | Date | undefined) => string;
}

export const PaymentWarningSection: React.FC<PaymentWarningSectionProps> = ({
  pendingPayments,
  acknowledgedPayments,
  onAcknowledgePayments,
  isPaymentHistoryOpen,
  formatDate
}) => {
  if (!isPaymentHistoryOpen || pendingPayments.length === 0) return null;
  
  const totalPending = pendingPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <h4 className="font-medium text-amber-700">
          {pendingPayments.length} Pending {pendingPayments.length === 1 ? 'Payment' : 'Payments'}
        </h4>
      </div>
      
      <div className="text-sm text-gray-600">
        <p>
          This vehicle has {pendingPayments.length} pending {pendingPayments.length === 1 ? 'payment' : 'payments'} 
          totaling <span className="font-semibold">{totalPending.toFixed(2)} QAR</span>.
          These payments will need to be addressed.
        </p>
      </div>
      
      <div className="mt-2 border rounded-md overflow-hidden">
        <div className="bg-gray-50 px-3 py-2 text-sm font-medium">Payment History</div>
        <div className="divide-y">
          {pendingPayments.map(payment => (
            <div key={payment.id} className="px-3 py-2 text-sm">
              <div className="flex justify-between">
                <span>{payment.description || "Monthly Payment"}</span>
                <span className="font-semibold">{payment.amount?.toFixed(2) || 0} QAR</span>
              </div>
              <div className="text-xs text-gray-500 mt-1 flex justify-between">
                <span>Due: {formatDate(payment.payment_date)}</span>
                <span className="capitalize px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {payment.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledgedPayments}
            onChange={(e) => onAcknowledgePayments(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm">I understand this vehicle has pending payments</span>
        </label>
      </div>
    </div>
  );
};
