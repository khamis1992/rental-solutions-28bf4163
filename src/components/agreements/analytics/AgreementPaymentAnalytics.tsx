
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface PaymentAnalyticsProps {
  totalAmount: number;
  amountPaid: number;
  balance: number;
  lateFees: number;
  paidOnTime: number;
  paidLate: number;
  unpaid: number;
}

export function AgreementPaymentAnalytics({
  totalAmount,
  amountPaid,
  balance,
  lateFees,
  paidOnTime,
  paidLate,
  unpaid
}: PaymentAnalyticsProps) {
  const totalPayments = paidOnTime + paidLate + unpaid;
  const paymentProgress = totalAmount > 0 ? (amountPaid / totalAmount) * 100 : 0;

  const paidOnTimePercentage = totalPayments > 0 ? (paidOnTime / totalPayments) * 100 : 0;
  const paidLatePercentage = totalPayments > 0 ? (paidLate / totalPayments) * 100 : 0;
  const unpaidPercentage = totalPayments > 0 ? (unpaid / totalPayments) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Financial Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border">
            <p className="text-sm font-medium text-blue-600 mb-1">Total Amount</p>
            <p className="text-2xl font-bold text-blue-900">QAR {formatCurrency(totalAmount)}</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border">
            <p className="text-sm font-medium text-green-600 mb-1">Amount Paid</p>
            <p className="text-2xl font-bold text-green-900">QAR {formatCurrency(amountPaid)}</p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg border">
            <p className="text-sm font-medium text-orange-600 mb-1">Remaining Balance</p>
            <p className="text-2xl font-bold text-orange-900">QAR {formatCurrency(balance)}</p>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border">
            <p className="text-sm font-medium text-red-600 mb-1">Late Fees</p>
            <p className="text-2xl font-bold text-red-900">QAR {formatCurrency(lateFees)}</p>
          </div>
        </div>

        {/* Payment Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Payment Progress</h4>
            <span className="text-sm font-medium text-gray-600">{Math.round(paymentProgress)}%</span>
          </div>
          <Progress value={paymentProgress} className="h-3" />
        </div>

        {/* Payment Status Indicators */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Payment Status</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Paid on Time */}
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700">Paid on Time</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-green-600">{paidOnTime} payments</span>
                  <span className="text-xs font-medium text-green-700">{Math.round(paidOnTimePercentage)}%</span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${paidOnTimePercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Paid Late */}
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg border">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-700">Paid Late</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-yellow-600">{paidLate} payments</span>
                  <span className="text-xs font-medium text-yellow-700">{Math.round(paidLatePercentage)}%</span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-yellow-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${paidLatePercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Unpaid */}
            <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700">Unpaid</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-red-600">{unpaid} payments</span>
                  <span className="text-xs font-medium text-red-700">{Math.round(unpaidPercentage)}%</span>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-red-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${unpaidPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
