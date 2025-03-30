import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LineChart, BarChart } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RevenueChartData {
  name: string;
  revenue: number;
  expenses?: number;
}

interface RevenueChartProps {
  data: RevenueChartData[];
  title?: string;
  description?: string;
  fullWidth?: boolean;
}

const FinancialRevenueChart: React.FC<RevenueChartProps> = ({ 
  data, 
  title = "Financial Overview",
  description = "Revenue, expenses, and profit trends",
  fullWidth = false 
}) => {
  const [timePeriod, setTimePeriod] = useState<string>("6");
  const [viewType, setViewType] = useState<'area' | 'bar'>('area');
  
  const ensureCompleteData = (inputData: RevenueChartData[]): RevenueChartData[] => {
    if (!inputData || inputData.length === 0) {
      console.log("No revenue data provided, showing placeholder data");
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
      return months.map(month => ({
        name: month,
        revenue: Math.floor(Math.random() * 5000) + 3000,
        expenses: Math.floor(Math.random() * 3000) + 2000
      }));
    }
    
    console.log("Processing revenue chart data:", inputData);
    
    return inputData.map(item => ({
      ...item,
      expenses: item.expenses || Math.floor(item.revenue * 0.6)
    }));
  };
  
  const chartData = ensureCompleteData(data);

  const getFilteredData = () => {
    const months = parseInt(timePeriod);
    if (months && chartData.length > months) {
      return chartData.slice(-months);
    }
    return chartData;
  };

  const filteredData = getFilteredData();
  
  const getProfit = (revenue: number, expenses: number) => {
    return revenue - expenses;
  };

  return (
    <Card className={`card-transition ${fullWidth ? 'col-span-full' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center rounded-md border p-1">
            <Button
              variant={viewType === 'area' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewType('area')}
              className="h-8 w-8 p-0"
            >
              <LineChart className="h-4 w-4" />
            </Button>
            <Button
              variant={viewType === 'bar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewType('bar')}
              className="h-8 w-8 p-0"
            >
              <BarChart className="h-4 w-4" />
            </Button>
          </div>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
              <SelectItem value="24">Last 24 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filteredData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 10,
              }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value).split('.')[0]}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'expenses') return [formatCurrency(value), 'Expenses'];
                  return [formatCurrency(value), 'Revenue'];
                }}
                labelFormatter={(label) => `Month: ${label}`}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const revenue = payload[0]?.value as number || 0;
                    const expenses = payload[1]?.value as number || 0;
                    const profit = getProfit(revenue, expenses);
                    
                    return (
                      <div className="custom-tooltip bg-white p-3 border border-gray-200 rounded-md shadow">
                        <p className="font-medium">{label}</p>
                        <p className="text-blue-600">Revenue: {formatCurrency(revenue)}</p>
                        <p className="text-green-600">Expenses: {formatCurrency(expenses)}</p>
                        <p className={`font-medium ${profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          Profit: {formatCurrency(profit)}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                name="Revenue"
                stackId="1"
                stroke="#8884d8" 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="expenses" 
                name="Expenses"
                stackId="2"
                stroke="#4ade80" 
                fillOpacity={1} 
                fill="url(#colorExpenses)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialRevenueChart;
