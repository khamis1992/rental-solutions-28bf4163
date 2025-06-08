
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface PaymentAnalyticsProps {
  amountPaid: number;
  balance: number;
  lateFees: number;
  totalAmount?: number;
  paidOnTime?: number;
  paidLate?: number;
  unpaid?: number;
}

export function PaymentAnalytics({ 
  amountPaid, 
  balance, 
  lateFees, 
  totalAmount = 0,
  paidOnTime = 0,
  paidLate = 0,
  unpaid = 0
}: PaymentAnalyticsProps) {
  const paymentProgress = totalAmount > 0 ? (amountPaid / totalAmount) * 100 : 0;
  const totalPayments = paidOnTime + paidLate + unpaid;
  const onTimePercentage = totalPayments > 0 ? (paidOnTime / totalPayments) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Main Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-700">QAR {formatCurrency(amountPaid)}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Remaining Balance</p>
                <p className="text-2xl font-bold text-blue-700">QAR {formatCurrency(balance)}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Late Fees</p>
                <p className="text-2xl font-bold text-red-700">QAR {formatCurrency(lateFees)}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Payment Progress
          </CardTitle>
          <CardDescription>Track your payment completion status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Contract Completion</span>
              <span className="font-medium">{paymentProgress.toFixed(1)}%</span>
            </div>
            <Progress value={paymentProgress} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>QAR {formatCurrency(amountPaid)} paid</span>
              <span>QAR {formatCurrency(totalAmount)} total</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Payment Performance
            </CardTitle>
            <CardDescription>On-time payment statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">On-Time Rate</span>
                <Badge variant={onTimePercentage >= 80 ? "default" : onTimePercentage >= 60 ? "secondary" : "destructive"}>
                  {onTimePercentage.toFixed(1)}%
                </Badge>
              </div>
              <div className="space-y-2">
                <Progress value={onTimePercentage} className="h-2" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-semibold text-green-600">{paidOnTime}</div>
                  <div className="text-muted-foreground">On Time</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-orange-600">{paidLate}</div>
                  <div className="text-muted-foreground">Late</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-red-600">{unpaid}</div>
                  <div className="text-muted-foreground">Unpaid</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Payment Summary
            </CardTitle>
            <CardDescription>Quick overview of payment status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Payments</span>
                <span className="font-semibold">{totalPayments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Payment Completion</span>
                <span className="font-semibold">{paymentProgress.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Outstanding Amount</span>
                <span className="font-semibold text-red-600">QAR {formatCurrency(balance + lateFees)}</span>
              </div>
              {lateFees > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm">Late Fee Impact</span>
                  <span className="font-semibold text-red-600">
                    +{((lateFees / totalAmount) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Health Status</CardTitle>
          <CardDescription>Overall assessment of payment performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800">Payment Status</div>
                <div className="text-sm text-green-600">
                  {balance === 0 ? 'Fully Paid' : paymentProgress >= 50 ? 'On Track' : 'Behind Schedule'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-blue-800">Progress Trend</div>
                <div className="text-sm text-blue-600">
                  {paymentProgress > 75 ? 'Excellent' : paymentProgress > 50 ? 'Good' : 'Needs Attention'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-800">Risk Level</div>
                <div className="text-sm text-orange-600">
                  {lateFees === 0 && onTimePercentage > 80 ? 'Low' : 
                   lateFees > 0 || onTimePercentage < 60 ? 'High' : 'Medium'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
