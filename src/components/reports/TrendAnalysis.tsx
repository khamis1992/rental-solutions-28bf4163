import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface TrendAnalysisProps {
  title: string;
  description?: string;
  data: any[];
  timeField: string;
  metrics: {
    key: string;
    name: string;
    color: string;
    formatter?: (value: any) => string;
  }[];
  comparisonOptions?: {
    key: string;
    name: string;
    calculate: (data: any[], timeField: string, metric: string) => any[];
  }[];
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({
  title,
  description,
  data,
  timeField,
  metrics,
  comparisonOptions = []
}) => {
  const [selectedMetric, setSelectedMetric] = useState(metrics[0]?.key || '');
  const [comparisonType, setComparisonType] = useState('none');
  
  const getComparisonData = () => {
    if (comparisonType === 'none') {
      return data;
    }
    
    const comparisonOption = comparisonOptions.find(option => option.key === comparisonType);
    if (!comparisonOption) return data;
    
    return comparisonOption.calculate(data, timeField, selectedMetric);
  };
  
  const chartData = getComparisonData();
  
  const selectedMetricObj = metrics.find(m => m.key === selectedMetric);
  const formatter = selectedMetricObj?.formatter || ((value) => value?.toString() || '');
  
  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="text-right">{title}</CardTitle>
        {description && <CardDescription className="text-right">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4 mb-6 flex-row-reverse">
          <div className="flex items-center gap-2 flex-row-reverse">
            <Label className="text-right">المقياس</Label>
            <Select
              value={selectedMetric}
              onValueChange={setSelectedMetric}
            >
              <SelectTrigger className="w-[180px] text-right" dir="rtl">
                <SelectValue placeholder="اختر المقياس" />
              </SelectTrigger>
              <SelectContent>
                {metrics.map(metric => (
                  <SelectItem key={metric.key} value={metric.key} className="text-right">
                    {metric.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {comparisonOptions.length > 0 && (
            <div className="flex items-center gap-2 flex-row-reverse">
              <Label className="text-right">المقارنة</Label>
              <Select
                value={comparisonType}
                onValueChange={setComparisonType}
              >
                <SelectTrigger className="w-[180px] text-right" dir="rtl">
                  <SelectValue placeholder="اختر نوع المقارنة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-right">بدون مقارنة</SelectItem>
                  {comparisonOptions.map(option => (
                    <SelectItem key={option.key} value={option.key} className="text-right">
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={timeField} 
                angle={-45} 
                textAnchor="end" 
                height={60}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  const metricObj = metrics.find(m => m.name === String(name));
                  if (metricObj?.formatter) {
                    return [metricObj.formatter(value), String(name)];
                  }
                  return [value, String(name)];
                }}
              />
              <Legend />
              
              {comparisonType === 'none' ? (
                <Line
                  type="monotone"
                  dataKey={selectedMetric}
                  name={selectedMetricObj?.name || selectedMetric}
                  stroke={selectedMetricObj?.color || '#8884d8'}
                  activeDot={{ r: 8 }}
                />
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="current"
                    name="الحالي"
                    stroke="#3b82f6"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="comparison"
                    name="المقارنة"
                    stroke="#f59e0b"
                    activeDot={{ r: 8 }}
                    strokeDasharray="5 5"
                  />
                  {chartData[0]?.difference !== undefined && (
                    <Line
                      type="monotone"
                      dataKey="difference"
                      name="الفرق"
                      stroke="#ef4444"
                      activeDot={{ r: 8 }}
                    />
                  )}
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendAnalysis;
