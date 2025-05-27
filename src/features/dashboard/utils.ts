
import { DashboardFilters, QuickAction } from './types';
import { UserRole } from '@/types/user-types';

export const getDefaultFilters = (): DashboardFilters => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // Last 30 days

  return {
    dateRange: {
      start: startDate,
      end: endDate,
    },
  };
};

export const getQuickActions = (userRole: UserRole): QuickAction[] => {
  const allActions: QuickAction[] = [
    {
      id: 'add-vehicle',
      title: 'Add Vehicle',
      description: 'Register a new vehicle',
      icon: 'Plus',
      path: '/vehicles/add',
      color: 'blue',
      requiresRole: ['admin', 'staff'],
    },
    {
      id: 'add-customer',
      title: 'Add Customer',
      description: 'Register a new customer',
      icon: 'UserPlus',
      path: '/customers/add',
      color: 'green',
      requiresRole: ['admin', 'staff'],
    },
    {
      id: 'create-agreement',
      title: 'Create Agreement',
      description: 'Create a new rental agreement',
      icon: 'FileText',
      path: '/agreements/add',
      color: 'purple',
      requiresRole: ['admin', 'staff'],
    },
    {
      id: 'schedule-maintenance',
      title: 'Schedule Maintenance',
      description: 'Schedule vehicle maintenance',
      icon: 'Wrench',
      path: '/maintenance/add',
      color: 'orange',
      requiresRole: ['admin', 'staff'],
    },
    {
      id: 'view-reports',
      title: 'View Reports',
      description: 'Access financial and operational reports',
      icon: 'BarChart3',
      path: '/reports',
      color: 'cyan',
    },
    {
      id: 'legal-cases',
      title: 'Legal Cases',
      description: 'Manage legal cases and compliance',
      icon: 'Scale',
      path: '/legal',
      color: 'red',
      requiresRole: ['admin', 'staff'],
    },
  ];

  return allActions.filter(action => 
    !action.requiresRole || action.requiresRole.includes(userRole)
  );
};

export const formatDateRange = (filters: DashboardFilters): string => {
  const { start, end } = filters.dateRange;
  
  const startStr = start.toLocaleDateString();
  const endStr = end.toLocaleDateString();
  
  if (startStr === endStr) {
    return startStr;
  }
  
  return `${startStr} - ${endStr}`;
};

export const isDateInRange = (date: Date, filters: DashboardFilters): boolean => {
  const { start, end } = filters.dateRange;
  return date >= start && date <= end;
};

export const calculateProgress = (current: number, target: number): number => {
  if (target === 0) return 0;
  return Math.min((current / target) * 100, 100);
};
