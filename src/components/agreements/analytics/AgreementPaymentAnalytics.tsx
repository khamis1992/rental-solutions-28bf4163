import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  CreditCard,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface AgreementPaymentAnalyticsProps {
  agreementId: string;
  payments: any[];
  rentAmount: number | null;
  contractAmount: number | null;
}

export function AgreementPaymentAnalytics({
  agreementId,
  payments,
  rentAmount,
  contractAmount
}: AgreementPaymentAnalyticsProps) {
  const [paymentSummary, setPaymentSummary] = useState({
    totalCollected: 0,
    outstandingBalance: 0,
    collectionRate: 0,
  });

  useEffect(() => {
    if (payments && payments.length > 0) {
      const totalCollected = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const outstandingBalance = (contractAmount || 0) - totalCollected;
      const collectionRate = (totalCollected / (contractAmount || 1)) * 100;

      setPaymentSummary({
        totalCollected,
        outstandingBalance,
        collectionRate,
      });
    } else {
      // Reset summary if no payments
      setPaymentSummary({
        totalCollected: 0,
        outstandingBalance: 0,
        collectionRate: 0,
      });
    }
  }, [payments, contractAmount]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const data = [
    { name: 'Collected', value: paymentSummary.totalCollected },
    { name: 'Outstanding', value: paymentSummary.outstandingBalance },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Payment Analytics</CardTitle>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Collected</p>
                  <p className="text-2xl font-semibold">{formatCurrency(paymentSummary.totalCollected)}</p>
                </div>
                <div className="bg-green-500/10 rounded-full p-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {paymentSummary.collectionRate.toFixed(2)}%
                </Badge>
                <span className="text-xs text-muted-foreground ml-2">from total contract</span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Outstanding Balance</p>
                  <p className="text-2xl font-semibold">{formatCurrency(paymentSummary.outstandingBalance)}</p>
                </div>
                <div className="bg-red-500/10 rounded-full p-2">
                  <CreditCard className="h-5 w-5 text-red-500" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                {paymentSummary.outstandingBalance > 0 ? (
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{paymentSummary.outstandingBalance.toFixed(2)}%
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {paymentSummary.outstandingBalance.toFixed(2)}%
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground ml-2">from last month</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart width={400} height={300}>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  width={500}
                  height={300}
                  data={payments}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="payment_date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </CardHeader>
    </Card>
  );
}
