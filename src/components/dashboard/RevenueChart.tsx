import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface RevenueData {
  month: string;
  amount: number;
}

export function RevenueChart() {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);

  useEffect(() => {
    // Mock data for demonstration
    const mockData: RevenueData[] = [
      { month: 'Jan', amount: 4000 },
      { month: 'Feb', amount: 3000 },
      { month: 'Mar', amount: 2000 },
      { month: 'Apr', amount: 2780 },
      { month: 'May', amount: 1890 },
      { month: 'Jun', amount: 2390 },
      { month: 'Jul', amount: 3490 },
    ];
    setRevenueData(mockData);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Chart</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="amount" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
