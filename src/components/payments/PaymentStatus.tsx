
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/utils';

interface PaymentStatusProps {
  status: string;
  late_fine_amount?: number;
  days_overdue?: number;
  amount: number;
}

export const PaymentStatusBadge = ({ status }: { status: string }) => {
  switch(status.toLowerCase()) {
    case 'completed':
    case 'paid':
      return <Badge className="bg-green-500 text-white">Paid</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-500 text-white">Cancelled</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export const PaymentMethodBadge = ({ method }: { method: string }) => {
  switch(method.toLowerCase()) {
    case 'cash':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Cash</Badge>;
    case 'credit_card':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Credit Card</Badge>;
    case 'bank_transfer':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Bank Transfer</Badge>;
    case 'debit_card':
      return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Debit Card</Badge>;
    case 'check':
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Check</Badge>;
    case 'mobile_payment':
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Mobile Payment</Badge>;
    default:
      return <Badge variant="outline">{method}</Badge>;
  }
};

export const PaymentAmountDisplay = ({ 
  amount, 
  late_fine_amount, 
  days_overdue 
}: PaymentStatusProps) => {
  if (late_fine_amount && late_fine_amount > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center">
              {formatCurrency(amount)}
              <Badge variant="destructive" className="ml-2">+Fine</Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Includes late fine: {formatCurrency(late_fine_amount)}</p>
            {days_overdue && (
              <p>{days_overdue} days overdue</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return <span className="font-medium">{formatCurrency(amount)}</span>;
};
