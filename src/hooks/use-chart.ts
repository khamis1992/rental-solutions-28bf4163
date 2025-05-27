
import { useMemo } from 'react';

interface ChartOptions {
  type: string;
  data: any;
  options: any;
}

export function useChart(config: ChartOptions) {
  const chartData = useMemo(() => {
    return {
      data: config.data,
      options: config.options
    };
  }, [config.data, config.options]);

  return { data: chartData };
}
