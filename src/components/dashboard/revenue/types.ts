
export interface RevenueData {
  name: string;
  revenue: number;
}

export interface RevenueChartProps {
  data: RevenueData[];
  fullWidth?: boolean;
}

export type ChartType = 'area' | 'bar' | 'line';
