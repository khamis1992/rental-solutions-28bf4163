
import React from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PaymentHistoryItem } from '@/types/payment-history.types';
import { Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaymentTableProps {
  payments: PaymentHistoryItem[];
  onEditPayment?: (payment: PaymentHistoryItem) => void;
  onDeletePayment?: (paymentId: string) => void;
}

export function PaymentTable({ payments, onEditPayment, onDeletePayment }: PaymentTableProps) {
  // Function to get payment status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'partially_paid':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to format payment type for display
  const formatPaymentType = (type?: string) => {
    if (!type) return 'N/A';
    
    // Convert to title case and replace underscores with spaces
    return type.charAt(0).toUpperCase() + 
           type.slice(1).toLowerCase().replace(/_/g, ' ');
  };

  return (
    <div className="relative overflow-x-auto rounded-md border">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3">Date</th>
            <th scope="col" className="px-4 py-3">Type</th>
            <th scope="col" className="px-4 py-3">Amount</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="px-4 py-3">Method</th>
            <th scope="col" className="px-4 py-3">Description</th>
            <th scope="col" className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-4 py-3">{formatDate(payment.payment_date)}</td>
              <td className="px-4 py-3">{formatPaymentType(payment.type)}</td>
              <td className="px-4 py-3 font-medium">{formatCurrency(payment.amount)}</td>
              <td className="px-4 py-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(payment.status)}`}>
                  {payment.status}
                </span>
              </td>
              <td className="px-4 py-3">{payment.payment_method || 'N/A'}</td>
              <td className="px-4 py-3 max-w-xs truncate">{payment.description || 'N/A'}</td>
              <td className="px-4 py-3">
                <div className="flex space-x-2">
                  {onEditPayment && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onEditPayment(payment)}
                      className="h-8 w-8"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDeletePayment && payment.id && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => onDeletePayment(payment.id)}
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
