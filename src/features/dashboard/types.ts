
export interface DashboardFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  vehicleStatus?: string[];
  agreementStatus?: string[];
  showOnlyOverdue?: boolean;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  color: string;
  requiresRole?: string[];
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'stat' | 'chart' | 'list' | 'grid';
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  data?: any;
  config?: Record<string, any>;
}
