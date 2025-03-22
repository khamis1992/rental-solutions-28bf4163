
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { CircleDollarSign, TrendingUp, ArrowDownRight, CreditCard } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';

const FinancialReport = () => {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(286500)} 
          trend={8}
          trendLabel="vs last month"
          icon={CircleDollarSign}
          iconColor="text-green-500"
        />
        <StatCard 
          title="Average Daily Revenue" 
          value={formatCurrency(9550)} 
          trend={5}
          trendLabel="vs last month"
          icon={TrendingUp}
          iconColor="text-blue-500"
        />
        <StatCard 
          title="Operational Expenses" 
          value={formatCurrency(67840)} 
          trend={3}
          trendLabel="vs last month"
          icon={ArrowDownRight}
          iconColor="text-amber-500"
        />
        <StatCard 
          title="Pending Payments" 
          value={formatCurrency(14350)} 
          trend={-12}
          trendLabel="vs last month"
          icon={CreditCard}
          iconColor="text-indigo-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyRevenueData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${formatCurrency(value/1000).split('.')[0]}k`}
                  />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Vehicle Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={revenueByVehicleType}
                  margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="type" 
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${formatCurrency(value/1000).split('.')[0]}k`}
                  />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell className="font-medium">{transaction.id}</TableCell>
                  <TableCell>{transaction.type}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell className={`text-right ${transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'Income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

const monthlyRevenueData = [
  { month: 'Jan', revenue: 48500 },
  { month: 'Feb', revenue: 52300 },
  { month: 'Mar', revenue: 49800 },
  { month: 'Apr', revenue: 58700 },
  { month: 'May', revenue: 69200 },
  { month: 'Jun', revenue: 74800 },
  { month: 'Jul', revenue: 79600 },
  { month: 'Aug', revenue: 82400 },
];

const revenueByVehicleType = [
  { type: 'Sedan', revenue: 94500 },
  { type: 'SUV', revenue: 78200 },
  { type: 'Luxury', revenue: 45900 },
  { type: 'Economy', revenue: 67300 },
];

const recentTransactions = [
  { id: 'TRX-7829', date: '2023-08-15', type: 'Income', description: 'Rental Payment - Toyota Camry', amount: 1250 },
  { id: 'TRX-7830', date: '2023-08-15', type: 'Expense', description: 'Maintenance - Ford Escape', amount: 350 },
  { id: 'TRX-7831', date: '2023-08-14', type: 'Income', description: 'Rental Payment - BMW 3 Series', amount: 1800 },
  { id: 'TRX-7832', date: '2023-08-14', type: 'Income', description: 'Rental Payment - Honda Civic', amount: 950 },
  { id: 'TRX-7833', date: '2023-08-13', type: 'Expense', description: 'Fuel - Fleet Refill', amount: 1200 },
];

export default FinancialReport;
