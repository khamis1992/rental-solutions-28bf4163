
interface PaymentStatusBarProps {
  paidOnTime: number;
  paidLate: number;
  unpaid: number;
  totalPayments: number;
}

export function PaymentStatusBar({
  paidOnTime,
  paidLate,
  unpaid,
  totalPayments
}: PaymentStatusBarProps) {
  return (
    <div className="mb-6" dir="rtl">
      <div className="text-sm font-medium mb-2 text-right">حالة المدفوعات</div>
      <div className="w-full bg-gray-200 h-2 rounded-full">
        <div className="flex h-2 rounded-full flex-row-reverse">
          {paidOnTime > 0 && (
            <div 
              className="bg-green-500 h-full rounded-r-full" 
              style={{ width: `${(paidOnTime / totalPayments) * 100}%` }}
            />
          )}
          {paidLate > 0 && (
            <div 
              className="bg-amber-500 h-full" 
              style={{ width: `${(paidLate / totalPayments) * 100}%` }}
            />
          )}
          {unpaid > 0 && (
            <div 
              className={`bg-red-500 h-full ${paidOnTime === 0 && paidLate === 0 ? 'rounded-r-full' : ''} ${unpaid === totalPayments ? 'rounded-full' : 'rounded-l-full'}`}
              style={{ width: `${(unpaid / totalPayments) * 100}%` }}
            />
          )}
        </div>
      </div>
      <div className="flex justify-between mt-2 text-xs text-muted-foreground flex-row-reverse">
        <div className="flex items-center flex-row-reverse">
          <div className="w-3 h-3 bg-green-500 ml-1 rounded-full"></div>
          مدفوع في الوقت: {paidOnTime}
        </div>
        <div className="flex items-center flex-row-reverse">
          <div className="w-3 h-3 bg-amber-500 ml-1 rounded-full"></div>
          دفع متأخر: {paidLate}
        </div>
        <div className="flex items-center flex-row-reverse">
          <div className="w-3 h-3 bg-red-500 ml-1 rounded-full"></div>
          غير مدفوع: {unpaid}
        </div>
      </div>
    </div>
  );
}
