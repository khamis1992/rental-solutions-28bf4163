
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { usePredictiveAnalytics } from '@/hooks/use-predictive-analytics';

export const PredictiveAnalytics = () => {
  const { 
    demandForecast, 
    priceOptimization,
    churnPredictions,
    isLoading 
  } = usePredictiveAnalytics();

  if (isLoading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Demand Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart width={500} height={300} data={demandForecast}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="predicted" stroke="#8884d8" />
            <Line type="monotone" dataKey="actual" stroke="#82ca9d" />
          </LineChart>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Price Optimization</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart width={500} height={300} data={priceOptimization}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="vehicleType" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="optimizedPrice" stroke="#8884d8" />
            <Line type="monotone" dataKey="currentPrice" stroke="#82ca9d" />
          </LineChart>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Churn Risk Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {churnPredictions.map((prediction, index) => (
              <div key={index} className="flex justify-between items-center">
                <span>{prediction.customer}</span>
                <span className={`px-2 py-1 rounded ${
                  prediction.riskScore > 0.7 ? 'bg-red-100' : 
                  prediction.riskScore > 0.4 ? 'bg-yellow-100' : 'bg-green-100'
                }`}>
                  {(prediction.riskScore * 100).toFixed(1)}% Risk
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
