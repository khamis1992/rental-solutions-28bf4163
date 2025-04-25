
export type ChartType = 'line' | 'bar' | 'area';

export interface RevenueChartProps {
  data: { name: string; revenue: number }[];
  fullWidth?: boolean;
}
