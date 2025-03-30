
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, BarChart, PieChart } from "lucide-react";
import { ResponsiveContainer, AreaChart as ReAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart as ReBarChart, Bar, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';
import { useFinancials } from "@/hooks/use-financials";
import { formatCurrency } from "@/lib/utils";

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

const monthlyData: RevenueData[] = [
  { name: 'Jan', revenue: 5200, expenses: 4100 },
  { name: 'Feb', revenue: 4800, expenses: 4200 },
  { name: 'Mar', revenue: 6000, expenses: 4500 },
  { name: 'Apr', revenue: 6700, expenses: 4800 },
  { name: 'May', revenue: 7500, expenses: 5000 },
  { name: 'Jun', revenue: 9000, expenses: 5500 },
  { name: 'Jul', revenue: 10000, expenses: 6000 },
  { name: 'Aug', revenue: 11000, expenses: 6500 },
];

const revenueCategories: CategoryData[] = [
  { name: 'Short-term Rentals', value: 42000 },
  { name: 'Long-term Rentals', value: 28000 },
  { name: 'Security Deposits', value: 15000 },
  { name: 'Late Fees', value: 5000 },
  { name: 'Other', value: 3000 },
];

const expenseCategories: CategoryData[] = [
  { name: 'Vehicle Maintenance', value: 15000 },
  { name: 'Salaries', value: 12000 },
  { name: 'Insurance', value: 8000 },
  { name: 'Rent', value: 5000 },
  { name: 'Utilities', value: 3000 },
  { name: 'Marketing', value: 2000 },
  { name: 'Others', value: 1500 },
];

const FinancialDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>("last-6-months");
  const [chartType, setChartType] = useState<string>("area");
  const { financialSummary, isLoadingSummary } = useFinancials();
  const [keyMetrics, setKeyMetrics] = useState<FinancialMetric[]>([]);

  useEffect(() => {
    if (financialSummary) {
      // Create dynamic key metrics based on actual financial data
      setKeyMetrics([
        { 
          name: 'Total Revenue', 
          value: financialSummary.totalIncome, 
          change: 12.5, 
          changeType: 'positive'
        },
        { 
          name: 'Total Expenses', 
          value: financialSummary.totalExpenses, 
          change: 5.7, 
          changeType: 'positive'
        },
        { 
          name: 'Net Profit', 
          value: financialSummary.netRevenue, 
          change: 18.2, 
          changeType: 'positive'
        },
        { 
          name: 'Profit Margin', 
          value: financialSummary.totalIncome > 0 
            ? Math.round((financialSummary.netRevenue / financialSummary.totalIncome) * 100)
            : 0, 
          change: 3.1, 
          changeType: 'positive'
        }
      ]);
    }
  }, [financialSummary]);

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
                {metric.name === 'Profit Margin' ? `${metric.value}%` : `QAR ${metric.value.toLocaleString()}`}
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

  if (isLoadingSummary) {
    return <div className="p-4">Loading financial data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {keyMetrics.map(renderMetricCard)}
      </div>

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
                  <Tooltip />
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
                  <Tooltip />
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
                    data={revenueCategories}
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
                  <Tooltip formatter={(value) => `QAR ${value.toLocaleString()}`} />
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
                    data={expenseCategories}
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
                  <Tooltip formatter={(value) => `QAR ${value.toLocaleString()}`} />
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
                  <div className="grid grid-cols-2 py-2 border-b">
                    <span className="font-medium">Net Income</span>
                    <span className="text-right font-bold">{formatCurrency(financialSummary?.netRevenue || 0)}</span>
                  </div>
                  <div className="grid grid-cols-2 py-2">
                    <span className="font-medium">Profit Margin</span>
                    <span className="text-right">
                      {financialSummary?.totalIncome 
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
