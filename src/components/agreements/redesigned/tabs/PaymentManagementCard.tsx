
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PaymentHistory } from '../../PaymentHistory';
import { formatCurrency } from '@/lib/utils';
import { CreditCard, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface PaymentManagementCardProps {
  agreement: any;
  payments: any[];
  isLoading: boolean;
  rentAmount: number | null;
  contractAmount: number | null;
  paymentMetrics: any;
  onPaymentDeleted: (id: string) => void;
  onPaymentUpdated: (payment: any) => Promise<boolean>;
  onRecordPayment: (payment: any) => Promise<void>;
  fetchPayments: () => void;
}

export function PaymentManagementCard({ 
  agreement,
  payments,
  isLoading,
  paymentMetrics,
  onPaymentDeleted,
  onPaymentUpdated,
  onRecordPayment,
  fetchPayments
}: PaymentManagementCardProps) {
  const hasPayments = payments && payments.length > 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md font-medium">Payment Management</CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchPayments}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Collected</p>
                  <p className="text-2xl font-semibold">{formatCurrency(paymentMetrics?.totalCollected || 0)}</p>
                </div>
                <div className="bg-green-500/10 rounded-full p-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{paymentMetrics?.collectionRate || 0}%
                </Badge>
                <span className="text-xs text-muted-foreground ml-2">from last month</span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Outstanding Balance</p>
                  <p className="text-2xl font-semibold">{formatCurrency(paymentMetrics?.outstandingBalance || 0)}</p>
                </div>
                <div className="bg-red-500/10 rounded-full p-2">
                  <CreditCard className="h-5 w-5 text-red-500" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                {(paymentMetrics?.outstandingBalanceTrend || 0) > 0 ? (
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{paymentMetrics?.outstandingBalanceTrend || 0}%
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {paymentMetrics?.outstandingBalanceTrend || 0}%
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground ml-2">from last month</span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Payments</h4>
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">Loading payment history...</div>
            ) : hasPayments ? (
              <PaymentHistory
                payments={payments}
                isLoading={isLoading}
                rentAmount={agreement?.rent_amount || null}
                contractAmount={agreement?.total_amount || null}
                onPaymentDeleted={onPaymentDeleted}
                onPaymentUpdated={onPaymentUpdated}
                onRecordPayment={onRecordPayment}
                leaseStartDate={agreement?.start_date || null}
                leaseEndDate={agreement?.end_date || null}
                leaseId={agreement?.id}
                agreement={agreement}
                fetchPayments={fetchPayments}
              />
            ) : (
              <div className="text-center py-4 text-muted-foreground">No payment history available.</div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Next payment due in 15 days
              </p>
            </div>
            <Button onClick={() => onRecordPayment(agreement)} size="sm">
              Record Payment
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
