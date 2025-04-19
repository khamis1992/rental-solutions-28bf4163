
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useDashboard } from '@/hooks/use-dashboard';
import { formatCurrency } from '@/lib/utils';

const FinancialDashboard = () => {
  const { 
    monthlyRevenue, 
    overduePayments, 
    isLoadingRevenue, 
    isLoadingOverduePayments 
  } = useDashboard();

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="income">Income</TabsTrigger>
        <TabsTrigger value="expenses">Expenses</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingRevenue ? (
                <div className="h-6 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <div className="text-2xl font-bold">{formatCurrency(monthlyRevenue || 0)}</div>
              )}
              <p className="text-xs text-muted-foreground">+2.5% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {isLoadingOverduePayments ? (
                <div className="h-6 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <div className="text-2xl font-bold text-destructive">{overduePayments || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Requiring immediate attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(23500)}</div>
              <p className="text-xs text-muted-foreground">-1.2% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(45000)}</div>
              <p className="text-xs text-muted-foreground">+5.2% from last month</p>
            </CardContent>
          </Card>
        </div>
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Note</AlertTitle>
          <AlertDescription>
            This is a simplified financial dashboard with placeholder data. In a production environment, 
            this would display actual financial metrics from your accounting system.
          </AlertDescription>
        </Alert>
      </TabsContent>
      
      <TabsContent value="income" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Income Details</CardTitle>
            <CardDescription>Detailed breakdown of income sources</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Income details will be displayed here.</p>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="expenses" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Expense Details</CardTitle>
            <CardDescription>Detailed breakdown of expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Expense details will be displayed here.</p>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="reports" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Financial Reports</CardTitle>
            <CardDescription>Access and generate financial reports</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Financial reports will be displayed here.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default FinancialDashboard;
