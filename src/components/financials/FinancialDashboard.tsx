
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, BarChart, PieChart } from "lucide-react";
import { ResponsiveContainer, AreaChart as ReAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart as ReBarChart, Bar, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';
import { useFinancials } from "@/hooks/use-financials";
import { formatCurrency } from "@/lib/utils";
import FinancialExpensesBreakdown from "@/components/financials/FinancialExpensesBreakdown";

interface FinancialMetric {
  name: string;
  value: number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
}

interface RevenueData {
  name: string;
  revenue: number;
  expenses: number;
}

interface CategoryData {
  name: string;
  value: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2', '#45B39D'];

const FinancialDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>("last-6-months");
  const [chartType, setChartType] = useState<string>("area");
  const { 
    financialSummary, 
    isLoadingSummary,
    transactions,
    expenses, 
    isLoadingTransactions 
  } = useFinancials();
  const [keyMetrics, setKeyMetrics] = useState<FinancialMetric[]>([]);
  const [monthlyData, setMonthlyData] = useState<RevenueData[]>([]);
  const [revenueCategories, setRevenueCategories] = useState<CategoryData[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<CategoryData[]>([]);

  useEffect(() => {
    if (financialSummary) {
      console.log("Financial Summary in Dashboard:", financialSummary);
      
      // Parse values to ensure they're numbers, with fallback to 0
      const totalExpenses = parseFloat(Number(financialSummary.totalExpenses || 0).toFixed(2));
      const totalIncome = parseFloat(Number(financialSummary.totalIncome || 0).toFixed(2));
      const netRevenue = parseFloat(Number(financialSummary.netRevenue || 0).toFixed(2));
      const overdueExpenses = parseFloat(Number(financialSummary.overdueExpenses || 0).toFixed(2));
      
      console.log("Dashboard metrics - Total Expenses:", totalExpenses);
      console.log("Dashboard metrics - Total Income:", totalIncome);
      console.log("Dashboard metrics - Net Revenue:", netRevenue);
      console.log("Dashboard metrics - Overdue Expenses:", overdueExpenses);
      
      // Create dynamic key metrics based on actual financial data with proper type handling
      setKeyMetrics([
        { 
          name: 'Total Revenue', 
          value: totalIncome, 
          change: 12.5, 
          changeType: 'positive'
        },
        { 
          name: 'Total Expenses', 
          value: totalExpenses,
          change: 5.7, 
          changeType: 'positive'
        },
        { 
          name: 'Net Profit', 
          value: netRevenue,
          change: 18.2, 
          changeType: 'positive'
        },
        { 
          name: 'Profit Margin', 
          value: totalIncome > 0 
            ? Math.round((netRevenue / totalIncome) * 100)
            : 0, 
          change: 3.1, 
          changeType: 'positive'
        }
      ]);
    }
  }, [financialSummary]);

  // Process transactions data for charts
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      console.log("Processing transactions for charts:", transactions.length);
      
      // Group transactions by month for the monthly chart
      const monthlyDataMap = new Map<string, RevenueData>();
      
      // Get months for the last 6 months
      const today = new Date();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Initialize with empty data for last 6 months
      for (let i = 5; i >= 0; i--) {
        const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = `${monthNames[month.getMonth()]} ${month.getFullYear()}`;
        monthlyDataMap.set(monthKey, { 
          name: monthNames[month.getMonth()], 
          revenue: 0, 
          expenses: 0 
        });
      }
      
      // Fill with actual data
      transactions.forEach(transaction => {
        if (!transaction.date) return;
        
        const date = new Date(transaction.date);
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        
        if (monthlyDataMap.has(monthKey)) {
          const current = monthlyDataMap.get(monthKey)!;
          
          if (transaction.type === 'income') {
            current.revenue += Number(transaction.amount || 0);
          } else {
            current.expenses += Number(transaction.amount || 0);
          }
          
          monthlyDataMap.set(monthKey, current);
        }
      });
      
      // Convert map to array for chart
      setMonthlyData(Array.from(monthlyDataMap.values()));
      
      // Process revenue categories
      const revenueCategoriesMap = new Map<string, number>();
      const expenseCategoriesMap = new Map<string, number>();
      
      transactions.forEach(transaction => {
        const amount = Number(transaction.amount || 0);
        const category = transaction.category || 'Other';
        
        if (transaction.type === 'income') {
          revenueCategoriesMap.set(
            category, 
            (revenueCategoriesMap.get(category) || 0) + amount
          );
        } else {
          expenseCategoriesMap.set(
            category, 
            (expenseCategoriesMap.get(category) || 0) + amount
          );
        }
      });
      
      // Convert maps to arrays for charts
      setRevenueCategories(
        Array.from(revenueCategoriesMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
      );
      
      setExpenseCategories(
        Array.from(expenseCategoriesMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
      );
      
      console.log("Monthly data processed:", monthlyData);
      console.log("Revenue categories:", revenueCategories);
      console.log("Expense categories:", expenseCategories);
    }
  }, [transactions]);

  useEffect(() => {
    // Debug on initial render and whenever financial data changes
    if (financialSummary) {
      console.table({
        "totalIncome": financialSummary.totalIncome,
        "totalExpenses": financialSummary.totalExpenses,
        "currentMonthDue": financialSummary.currentMonthDue,
        "netRevenue": financialSummary.netRevenue,
        "overdueExpenses": financialSummary.overdueExpenses,
        "keyMetrics": keyMetrics.map(m => `${m.name}: ${m.value}`)
      });
    } else {
      console.log("No financial summary data available");
    }
  }, [financialSummary, keyMetrics]);

  const renderMetricCard = (metric: FinancialMetric) => {
    const changeClass = 
      metric.changeType === 'positive' ? 'text-green-600' : 
      metric.changeType === 'negative' ? 'text-red-600' : 
      'text-gray-600';
    
    const changeIcon = 
      metric.changeType === 'positive' ? '↑' : 
      metric.changeType === 'negative' ? '↓' : 
      '→';
    
    return (
      <Card key={metric.name}>
        <CardContent className="p-6">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-bold">
                {metric.name === 'Profit Margin' ? `${metric.value}%` : formatCurrency(metric.value)}
              </h3>
              <div className={`flex items-center gap-1 text-sm ${changeClass}`}>
                <span>{changeIcon}</span>
                <span>{metric.change}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoadingSummary || isLoadingTransactions) {
    return <div className="p-4">Loading financial data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {keyMetrics.map(renderMetricCard)}
      </div>

      <FinancialExpensesBreakdown />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between">
            <div>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>Revenue, expenses, and profit trends</CardDescription>
            </div>
            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
              <div className="flex border rounded-md overflow-hidden">
                <button 
                  className={`p-2 ${chartType === 'area' ? 'bg-primary text-primary-foreground' : 'bg-transparent'}`}
                  onClick={() => setChartType('area')}
                >
                  <AreaChart className="h-4 w-4" />
                </button>
                <button 
                  className={`p-2 ${chartType === 'bar' ? 'bg-primary text-primary-foreground' : 'bg-transparent'}`}
                  onClick={() => setChartType('bar')}
                >
                  <BarChart className="h-4 w-4" />
                </button>
              </div>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-30-days">Last 30 days</SelectItem>
                  <SelectItem value="last-3-months">Last 3 months</SelectItem>
                  <SelectItem value="last-6-months">Last 6 months</SelectItem>
                  <SelectItem value="last-year">Last year</SelectItem>
                  <SelectItem value="all-time">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <ReAreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8884d8" 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#82ca9d" 
                    fillOpacity={1} 
                    fill="url(#colorExpenses)" 
                  />
                </ReAreaChart>
              ) : (
                <ReBarChart
                  data={monthlyData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                  <Bar dataKey="expenses" fill="#82ca9d" name="Expenses" />
                </ReBarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Revenue distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={revenueCategories.length > 0 ? revenueCategories : [{ name: 'No Data', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {revenueCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Expense distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={expenseCategories.length > 0 ? expenseCategories : [{ name: 'No Data', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#82ca9d"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Reporting</CardTitle>
          <CardDescription>Generate and view financial reports</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="income">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="income">Income Statement</TabsTrigger>
              <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
              <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
              <TabsTrigger value="tax">Tax Reports</TabsTrigger>
            </TabsList>
            <TabsContent value="income" className="py-4">
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-4">Income Statement</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 py-2 border-b">
                    <span className="font-medium">Revenue</span>
                    <span className="text-right">{formatCurrency(financialSummary?.totalIncome || 0)}</span>
                  </div>
                  <div className="grid grid-cols-2 py-2 border-b">
                    <span className="font-medium">Expenses</span>
                    <span className="text-right">{formatCurrency(financialSummary?.totalExpenses || 0)}</span>
                  </div>
                  {financialSummary?.overdueExpenses > 0 && (
                    <div className="grid grid-cols-2 py-2 border-b">
                      <span className="font-medium text-red-600">Overdue Expenses</span>
                      <span className="text-right text-red-600">{formatCurrency(financialSummary?.overdueExpenses || 0)}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 py-2 border-b">
                    <span className="font-medium">Net Income</span>
                    <span className="text-right font-bold">{formatCurrency(financialSummary?.netRevenue || 0)}</span>
                  </div>
                  <div className="grid grid-cols-2 py-2">
                    <span className="font-medium">Profit Margin</span>
                    <span className="text-right">
                      {financialSummary?.totalIncome && financialSummary.totalIncome > 0
                        ? ((financialSummary.netRevenue / financialSummary.totalIncome) * 100).toFixed(2)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="balance" className="py-4">
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-4">Balance Sheet</h3>
                <p className="text-muted-foreground">Balance sheet reporting coming soon</p>
              </div>
            </TabsContent>
            <TabsContent value="cash-flow" className="py-4">
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-4">Cash Flow Statement</h3>
                <p className="text-muted-foreground">Cash flow reporting coming soon</p>
              </div>
            </TabsContent>
            <TabsContent value="tax" className="py-4">
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-4">Tax Reports</h3>
                <p className="text-muted-foreground">Tax reporting coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialDashboard;
