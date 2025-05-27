
export interface ActivityItem {
  id: string;
  type: 'agreement' | 'payment' | 'maintenance' | 'legal' | 'vehicle' | 'customer';
  action: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    role: string;
  };
  metadata?: Record<string, any>;
}

export const formatActivityDescription = (activity: ActivityItem): string => {
  const { type, action, metadata } = activity;
  
  switch (type) {
    case 'agreement':
      if (action === 'created') return `New agreement created for ${metadata?.customerName}`;
      if (action === 'updated') return `Agreement ${metadata?.agreementId} updated`;
      if (action === 'terminated') return `Agreement ${metadata?.agreementId} terminated`;
      break;
    case 'payment':
      if (action === 'recorded') return `Payment of ${metadata?.amount} recorded`;
      if (action === 'late') return `Late payment notification sent`;
      break;
    case 'maintenance':
      if (action === 'scheduled') return `Maintenance scheduled for ${metadata?.vehicleId}`;
      if (action === 'completed') return `Maintenance completed on ${metadata?.vehicleId}`;
      break;
    case 'legal':
      if (action === 'case_created') return `New legal case created`;
      if (action === 'case_updated') return `Legal case ${metadata?.caseId} updated`;
      break;
    case 'vehicle':
      if (action === 'added') return `New vehicle ${metadata?.vehicleId} added`;
      if (action === 'status_changed') return `Vehicle ${metadata?.vehicleId} status changed`;
      break;
    case 'customer':
      if (action === 'registered') return `New customer ${metadata?.customerName} registered`;
      if (action === 'updated') return `Customer ${metadata?.customerName} profile updated`;
      break;
  }
  
  return activity.description || 'Unknown activity';
};

export const getActivityIcon = (type: ActivityItem['type']): string => {
  const icons = {
    agreement: 'FileText',
    payment: 'CreditCard',
    maintenance: 'Wrench',
    legal: 'Scale',
    vehicle: 'Car',
    customer: 'User',
  };
  
  return icons[type] || 'Activity';
};

export const getActivityColor = (type: ActivityItem['type']): string => {
  const colors = {
    agreement: 'blue',
    payment: 'green',
    maintenance: 'orange',
    legal: 'purple',
    vehicle: 'gray',
    customer: 'cyan',
  };
  
  return colors[type] || 'gray';
};

export const sortActivitiesByTimestamp = (activities: ActivityItem[]): ActivityItem[] => {
  return [...activities].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

export const filterActivitiesByType = (
  activities: ActivityItem[],
  types: ActivityItem['type'][]
): ActivityItem[] => {
  return activities.filter(activity => types.includes(activity.type));
};

export const filterActivitiesByDateRange = (
  activities: ActivityItem[],
  startDate: Date,
  endDate: Date
): ActivityItem[] => {
  return activities.filter(activity => {
    const activityDate = new Date(activity.timestamp);
    return activityDate >= startDate && activityDate <= endDate;
  });
};
