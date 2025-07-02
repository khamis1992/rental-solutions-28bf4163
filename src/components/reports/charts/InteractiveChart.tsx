import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Sector, RadialBarChart, RadialBar, TooltipProps
} from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

import { formatCurrency } from '@/lib/utils';

type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'radialBar';

interface ChartDataPoint {
  [key: string]: any;
}

interface InteractiveChartProps {
  title: string;
  description?: string;
  data: ChartDataPoint[];
  defaultChartType?: ChartType;
  allowedChartTypes?: ChartType[];
  xAxisKey?: string;
  series: {
    key: string;
    name: string;
    color: string;
  }[];
  formatters?: {
    [key: string]: (value: any) => string;
  };
  showDataTable?: boolean;
  filters?: {
    key: string;
    name: string;
    options: { label: string; value: any }[];
  }[];
}

const defaultColors = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#0ea5e9', '#f43f5e', '#84cc16'
];

const renderActiveShape = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value, name } = props;
  const sin = Math.sin(-midAngle * Math.PI / 180);
  const cos = Math.cos(-midAngle * Math.PI / 180);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">
        {`${name}: ${value}`}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const InteractiveChart: React.FC<InteractiveChartProps> = ({
  title,
  description,
  data,
  defaultChartType = 'bar',
  allowedChartTypes = ['bar', 'line', 'area', 'pie'],
  xAxisKey = 'name',
  series,
  formatters = {},
  showDataTable = false,
  filters = []
}) => {
  const [chartType, setChartType] = useState(defaultChartType as ChartType);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showPercentages, setShowPercentages] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({} as Record<string, any>);
  const [stackedView, setStackedView] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  
  const filteredData = data.filter(item => {
    for (const [key, value] of Object.entries(selectedFilters)) {
      if (value !== undefined && item[key] !== value) {
        return false;
      }
    }
    return true;
  });
  
  const handleFilterChange = (key: string, value: any) => {
    setSelectedFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }));
  };
  
  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  const formatValue = (key: string, value: any) => {
    if (formatters[key]) {
      return formatters[key](value);
    }
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  };
  
  const renderControls = () => (
    <div className="flex flex-wrap items-center gap-4 mb-4" dir="rtl">
      {allowedChartTypes.length > 1 && (
        <div className="flex items-center space-x-2 flex-row-reverse">
          <Label className="text-right">نوع المخطط</Label>
          <Select
            value={chartType}
            onValueChange={(value) => setChartType(value as ChartType)}
          >
            <SelectTrigger className="w-[140px] text-right" dir="rtl">
              <SelectValue placeholder="نوع المخطط" />
            </SelectTrigger>
            <SelectContent>
              {allowedChartTypes.includes('bar') && (
                <SelectItem value="bar" className="text-right">مخطط الأعمدة</SelectItem>
              )}
              {allowedChartTypes.includes('line') && (
                <SelectItem value="line" className="text-right">مخطط الخطوط</SelectItem>
              )}
              {allowedChartTypes.includes('area') && (
                <SelectItem value="area" className="text-right">مخطط المساحة</SelectItem>
              )}
              {allowedChartTypes.includes('pie') && (
                <SelectItem value="pie" className="text-right">مخطط دائري</SelectItem>
              )}
              {allowedChartTypes.includes('radialBar') && (
                <SelectItem value="radialBar" className="text-right">مخطط شعاعي</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      )}
      
      {(chartType === 'bar' || chartType === 'area' || chartType === 'line') && (
        <div className="flex items-center space-x-2 flex-row-reverse">
          <Switch
            checked={stackedView}
            onCheckedChange={setStackedView}
            id="stacked-mode"
          />
          <Label htmlFor="stacked-mode" className="text-right">مكدس</Label>
        </div>
      )}
      
      <div className="flex items-center space-x-2 flex-row-reverse">
        <Switch
          checked={showLegend}
          onCheckedChange={setShowLegend}
          id="show-legend"
        />
        <Label htmlFor="show-legend" className="text-right">إظهار الوصف</Label>
      </div>
      
      {chartType === 'pie' && (
        <div className="flex items-center space-x-2 flex-row-reverse">
          <Switch
            checked={showPercentages}
            onCheckedChange={setShowPercentages}
            id="show-percentages"
          />
          <Label htmlFor="show-percentages" className="text-right">إظهار النسب المئوية</Label>
        </div>
      )}
    </div>
  );
  
  const renderFilters = () => (
    filters.length > 0 && (
      <div className="flex flex-wrap items-center gap-4 mb-4" dir="rtl">
        {filters.map((filter) => (
          <div key={filter.key} className="flex items-center space-x-2 flex-row-reverse">
            <Label className="text-right">{filter.name}</Label>
            <Select
              value={selectedFilters[filter.key] || 'all'}
              onValueChange={(value) => handleFilterChange(filter.key, value)}
            >
              <SelectTrigger className="w-[160px] text-right" dir="rtl">
                <SelectValue placeholder={`اختر ${filter.name}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-right">الكل</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-right">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    )
  );
  
  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={filteredData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={xAxisKey} 
                angle={-45} 
                textAnchor="end" 
                height={60} 
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  const seriesObj = series.find(s => s.key === String(name) || s.name === String(name));
                  return [formatValue(seriesObj?.key || String(name), value), seriesObj?.name || String(name)];
                }}
              />
              {showLegend && <Legend />}
              {series.map((s, index) => (
                <Bar 
                  key={s.key} 
                  dataKey={s.key} 
                  name={s.name} 
                  fill={s.color || defaultColors[index % defaultColors.length]} 
                  stackId={stackedView ? "stack" : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={filteredData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={xAxisKey} 
                angle={-45} 
                textAnchor="end" 
                height={60}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  const seriesObj = series.find(s => s.key === String(name) || s.name === String(name));
                  return [formatValue(seriesObj?.key || String(name), value), seriesObj?.name || String(name)];
                }}
              />
              {showLegend && <Legend />}
              {series.map((s, index) => (
                <Line 
                  key={s.key} 
                  type="monotone" 
                  dataKey={s.key} 
                  name={s.name} 
                  stroke={s.color || defaultColors[index % defaultColors.length]} 
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart
              data={filteredData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={xAxisKey} 
                angle={-45} 
                textAnchor="end" 
                height={60}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  const seriesObj = series.find(s => s.key === String(name) || s.name === String(name));
                  return [formatValue(seriesObj?.key || String(name), value), seriesObj?.name || String(name)];
                }}
              />
              {showLegend && <Legend />}
              {series.map((s, index) => (
                <Area 
                  key={s.key} 
                  type="monotone" 
                  dataKey={s.key} 
                  name={s.name} 
                  fill={s.color || defaultColors[index % defaultColors.length]} 
                  stroke={s.color || defaultColors[index % defaultColors.length]} 
                  stackId={stackedView ? "stack" : undefined}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
        
      case 'pie':
        const pieData = filteredData.map(item => ({
          name: item[xAxisKey],
          value: item[series[0].key]
        }));
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={showPercentages ? 60 : 0}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={onPieEnter}
                label={showPercentages ? undefined : ({name, percent}) => 
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={series[0].color || defaultColors[index % defaultColors.length]} 
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [
                  formatValue(series[0].key, value), 
                  series[0].name
                ]}
              />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );
        
      case 'radialBar':
        const radialData = series.map((s, index) => {
          const total = filteredData.reduce((sum, item) => sum + (item[s.key] || 0), 0);
          return {
            name: s.name,
            value: total,
            fill: s.color || defaultColors[index % defaultColors.length]
          };
        });
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="10%" 
              outerRadius="80%" 
              barSize={20} 
              data={radialData}
            >
              <RadialBar
                background
                dataKey="value"
                label={{ position: 'insideStart', fill: '#fff' }}
              />
              <Tooltip 
                formatter={(value) => [
                  formatValue(series[0].key, value), 
                  'Total'
                ]}
              />
              {showLegend && <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" />}
            </RadialBarChart>
          </ResponsiveContainer>
        );
        
      default:
        return null;
    }
  };
  
  const renderDataTable = () => {
    if (!showDataTable || filteredData.length === 0) return null;
    
    return (
      <div className="mt-6 overflow-x-auto" dir="rtl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="p-2 text-right">{xAxisKey}</th>
              {series.map(s => (
                <th key={s.key} className="p-2 text-right">{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                <td className="p-2 border-t text-right">{item[xAxisKey]}</td>
                {series.map(s => (
                  <td key={s.key} className="p-2 border-t text-right">
                    {formatValue(s.key, item[s.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="text-right">{title}</CardTitle>
        {description && <CardDescription className="text-right">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {renderControls()}
        {renderFilters()}
        {filteredData.length > 0 ? (
          <>
            {renderChart()}
            {renderDataTable()}
          </>
        ) : (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground text-right" dir="rtl">
            لا توجد بيانات متاحة للمرشحات المحددة
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InteractiveChart;
