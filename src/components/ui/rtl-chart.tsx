import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { cn } from '@/lib/utils';
import { createRTLChartConfig, rtlChartConfig } from '@/utils/rtl-advanced-features';
import { formatQatarRiyal } from '@/utils/arabic-rtl-utils';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface RTLChartProps {
  data: ChartData<any>;
  options?: ChartOptions<any>;
  className?: string;
  height?: number;
  width?: number;
  title?: string;
  subtitle?: string;
  showLegend?: boolean;
  showTooltip?: boolean;
  currency?: boolean;
  arabicLabels?: boolean;
}

/**
 * RTL-aware Line Chart Component
 */
export const RTLLineChart: React.FC<RTLChartProps> = ({
  data,
  options = {},
  className,
  height = 400,
  title,
  subtitle,
  showLegend = true,
  showTooltip = true,
  currency = false,
  arabicLabels = true,
}) => {
  const chartRef = useRef<ChartJS>(null);

  const rtlOptions = createRTLChartConfig('line', {
    ...options,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      ...options.plugins,
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#1f2937',
        rtl: true,
        textDirection: 'rtl',
      },
      subtitle: {
        display: !!subtitle,
        text: subtitle,
        font: {
          size: 12,
        },
        color: '#6b7280',
        rtl: true,
        textDirection: 'rtl',
      },
      legend: {
        display: showLegend,
        position: 'top',
        align: 'end',
        rtl: true,
        textDirection: 'rtl',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        enabled: showTooltip,
        rtl: true,
        textDirection: 'rtl',
        titleAlign: 'right',
        bodyAlign: 'right',
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (currency) {
              label += formatQatarRiyal(context.parsed.y);
            } else {
              label += context.parsed.y.toLocaleString('ar-QA');
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        position: 'bottom',
        ticks: {
          font: {
            size: 11,
          },
          color: '#6b7280',
        },
        grid: {
          color: '#f3f4f6',
        },
      },
      y: {
        display: true,
        position: 'right',
        ticks: {
          font: {
            size: 11,
          },
          color: '#6b7280',
          callback: (value: any) => {
            if (currency) {
              return formatQatarRiyal(value);
            }
            return value.toLocaleString('ar-QA');
          },
        },
        grid: {
          color: '#f3f4f6',
        },
      },
    },
  });

  return (
    <div className={cn('w-full', className)} dir="rtl">
      <div style={{ height: `${height}px` }}>
        <Line ref={chartRef} data={data} options={rtlOptions} />
      </div>
    </div>
  );
};

/**
 * RTL-aware Bar Chart Component
 */
export const RTLBarChart: React.FC<RTLChartProps> = ({
  data,
  options = {},
  className,
  height = 400,
  title,
  subtitle,
  showLegend = true,
  showTooltip = true,
  currency = false,
  arabicLabels = true,
}) => {
  const chartRef = useRef<ChartJS>(null);

  const rtlOptions = createRTLChartConfig('bar', {
    ...options,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      ...options.plugins,
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#1f2937',
        rtl: true,
        textDirection: 'rtl',
      },
      subtitle: {
        display: !!subtitle,
        text: subtitle,
        font: {
          size: 12,
        },
        color: '#6b7280',
        rtl: true,
        textDirection: 'rtl',
      },
      legend: {
        display: showLegend,
        position: 'top',
        align: 'end',
        rtl: true,
        textDirection: 'rtl',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        enabled: showTooltip,
        rtl: true,
        textDirection: 'rtl',
        titleAlign: 'right',
        bodyAlign: 'right',
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (currency) {
              label += formatQatarRiyal(context.parsed.y);
            } else {
              label += context.parsed.y.toLocaleString('ar-QA');
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        position: 'bottom',
        ticks: {
          font: {
            size: 11,
          },
          color: '#6b7280',
        },
        grid: {
          color: '#f3f4f6',
        },
      },
      y: {
        display: true,
        position: 'right',
        ticks: {
          font: {
            size: 11,
          },
          color: '#6b7280',
          callback: (value: any) => {
            if (currency) {
              return formatQatarRiyal(value);
            }
            return value.toLocaleString('ar-QA');
          },
        },
        grid: {
          color: '#f3f4f6',
        },
      },
    },
  });

  return (
    <div className={cn('w-full', className)} dir="rtl">
      <div style={{ height: `${height}px` }}>
        <Bar ref={chartRef} data={data} options={rtlOptions} />
      </div>
    </div>
  );
};

/**
 * RTL-aware Pie Chart Component
 */
export const RTLPieChart: React.FC<RTLChartProps> = ({
  data,
  options = {},
  className,
  height = 400,
  title,
  subtitle,
  showLegend = true,
  showTooltip = true,
  currency = false,
}) => {
  const chartRef = useRef<ChartJS>(null);

  const rtlOptions = createRTLChartConfig('pie', {
    ...options,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      ...options.plugins,
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#1f2937',
        rtl: true,
        textDirection: 'rtl',
      },
      subtitle: {
        display: !!subtitle,
        text: subtitle,
        font: {
          size: 12,
        },
        color: '#6b7280',
        rtl: true,
        textDirection: 'rtl',
      },
      legend: {
        display: showLegend,
        position: 'right',
        align: 'center',
        rtl: true,
        textDirection: 'rtl',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
          generateLabels: (chart: any) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const value = data.datasets[0].data[i];
                const formattedValue = currency ? formatQatarRiyal(value) : value.toLocaleString('ar-QA');
                return {
                  text: `${label}: ${formattedValue}`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].borderColor?.[i] || '#fff',
                  lineWidth: 2,
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        enabled: showTooltip,
        rtl: true,
        textDirection: 'rtl',
        titleAlign: 'right',
        bodyAlign: 'right',
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            
            if (currency) {
              return `${label}: ${formatQatarRiyal(value)} (${percentage}%)`;
            } else {
              return `${label}: ${value.toLocaleString('ar-QA')} (${percentage}%)`;
            }
          },
        },
      },
    },
  });

  return (
    <div className={cn('w-full', className)} dir="rtl">
      <div style={{ height: `${height}px` }}>
        <Pie ref={chartRef} data={data} options={rtlOptions} />
      </div>
    </div>
  );
};

/**
 * RTL-aware Doughnut Chart Component
 */
export const RTLDoughnutChart: React.FC<RTLChartProps> = ({
  data,
  options = {},
  className,
  height = 400,
  title,
  subtitle,
  showLegend = true,
  showTooltip = true,
  currency = false,
}) => {
  const chartRef = useRef<ChartJS>(null);

  const rtlOptions = createRTLChartConfig('doughnut', {
    ...options,
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      ...options.plugins,
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold',
        },
        color: '#1f2937',
        rtl: true,
        textDirection: 'rtl',
      },
      subtitle: {
        display: !!subtitle,
        text: subtitle,
        font: {
          size: 12,
        },
        color: '#6b7280',
        rtl: true,
        textDirection: 'rtl',
      },
      legend: {
        display: showLegend,
        position: 'right',
        align: 'center',
        rtl: true,
        textDirection: 'rtl',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
          generateLabels: (chart: any) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const value = data.datasets[0].data[i];
                const formattedValue = currency ? formatQatarRiyal(value) : value.toLocaleString('ar-QA');
                return {
                  text: `${label}: ${formattedValue}`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].borderColor?.[i] || '#fff',
                  lineWidth: 2,
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        enabled: showTooltip,
        rtl: true,
        textDirection: 'rtl',
        titleAlign: 'right',
        bodyAlign: 'right',
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            
            if (currency) {
              return `${label}: ${formatQatarRiyal(value)} (${percentage}%)`;
            } else {
              return `${label}: ${value.toLocaleString('ar-QA')} (${percentage}%)`;
            }
          },
        },
      },
    },
  });

  return (
    <div className={cn('w-full', className)} dir="rtl">
      <div style={{ height: `${height}px` }}>
        <Doughnut ref={chartRef} data={data} options={rtlOptions} />
      </div>
    </div>
  );
};

/**
 * RTL Chart Container with common styling
 */
interface RTLChartContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  actions?: React.ReactNode;
}

export const RTLChartContainer: React.FC<RTLChartContainerProps> = ({
  children,
  title,
  subtitle,
  className,
  actions,
}) => {
  return (
    <div className={cn('bg-white rounded-lg border shadow-sm p-6', className)} dir="rtl">
      {(title || subtitle || actions) && (
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 text-right">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 text-right">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

/**
 * RTL Chart Grid for multiple charts
 */
interface RTLChartGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: number;
  className?: string;
}

export const RTLChartGrid: React.FC<RTLChartGridProps> = ({
  children,
  columns = 2,
  gap = 6,
  className,
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 lg:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const gapClass = `gap-${gap}`;

  return (
    <div className={cn('grid', gridCols[columns], gapClass, className)} dir="rtl">
      {children}
    </div>
  );
};

/**
 * Export all RTL chart components
 */
export {
  RTLLineChart as LineChart,
  RTLBarChart as BarChart,
  RTLPieChart as PieChart,
  RTLDoughnutChart as DoughnutChart,
  RTLChartContainer as ChartContainer,
  RTLChartGrid as ChartGrid,
}; 