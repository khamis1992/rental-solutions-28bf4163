
import { AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface MissingPayment {
  month: string;
  amount: number;
  daysOverdue: number;
  lateFee: number;
  totalDue: number;
}

interface MissingPaymentsAlertProps {
  missingPayments: MissingPayment[];
}

export const MissingPaymentsAlert = ({ missingPayments }: MissingPaymentsAlertProps) => {
  if (missingPayments.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-6 border border-red-200 rounded-md p-4 bg-red-50">
      <h3 className="text-sm font-medium text-red-800 mb-2 flex items-center">
        <AlertTriangle className="h-4 w-4 mr-2" />
        Missing Payments
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {missingPayments.map((item, index) => (
          <div key={index} className="bg-white text-red-700 border border-red-200 px-3 py-2 rounded text-sm">
            <div className="font-medium">{item.month}</div>
            <div className="font-semibold">{formatCurrency(item.amount)}</div>
            {item.daysOverdue > 0 && (
              <div className="mt-1 text-xs">
                <div className="text-amber-700">
                  {item.daysOverdue} {item.daysOverdue === 1 ? 'day' : 'days'} overdue
                </div>
                <div className="text-red-600 font-medium">
                  + {formatCurrency(item.lateFee)} fine
                </div>
                <div className="mt-1 font-bold text-red-700">
                  Total: {formatCurrency(item.totalDue)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
