import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ForecastData {
  month: string;
  actual: number;
  forecast: number;
}

export default function FinancialForecastChart({ data }: { data: ForecastData[] }) { // Renamed to avoid conflict
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Financial Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="actual" stroke="#8884d8" name="Actual Revenue" />
              <Line type="monotone" dataKey="forecast" stroke="#82ca9d" name="Forecast Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}