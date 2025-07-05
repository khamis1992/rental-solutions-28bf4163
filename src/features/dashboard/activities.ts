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
      if (action === 'created') return `تم إنشاء عقد جديد للعميل ${metadata?.customerName}`;
      if (action === 'updated') return `تم تحديث العقد ${metadata?.agreementId}`;
      if (action === 'terminated') return `تم إنهاء العقد ${metadata?.agreementId}`;
      break;
    case 'payment':
      if (action === 'recorded') return `تم تسجيل دفعة بقيمة ${metadata?.amount}`;
      if (action === 'late') return `تم إرسال إشعار دفعة متأخرة`;
      break;
    case 'maintenance':
      if (action === 'scheduled') return `تم جدولة صيانة للمركبة ${metadata?.vehicleId}`;
      if (action === 'completed') return `تم إكمال صيانة المركبة ${metadata?.vehicleId}`;
      break;
    case 'legal':
      if (action === 'case_created') return `تم إنشاء قضية قانونية جديدة`;
      if (action === 'case_updated') return `تم تحديث القضية القانونية ${metadata?.caseId}`;
      break;
    case 'vehicle':
      if (action === 'added') return `تم إضافة مركبة جديدة ${metadata?.vehicleId}`;
      if (action === 'status_changed') return `تم تغيير حالة المركبة ${metadata?.vehicleId}`;
      break;
    case 'customer':
      if (action === 'registered') return `تم تسجيل عميل جديد ${metadata?.customerName}`;
      if (action === 'updated') return `تم تحديث ملف العميل ${metadata?.customerName}`;
      break;
  }
  
  return activity.description || 'نشاط غير معروف';
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

export const getActivityTypeLabel = (type: ActivityItem['type']): string => {
  const labels = {
    agreement: 'العقود',
    payment: 'المدفوعات',
    maintenance: 'الصيانة',
    legal: 'القانونية',
    vehicle: 'المركبات',
    customer: 'العملاء',
  };
  
  return labels[type] || type;
};

export const getActionLabel = (action: string): string => {
  const labels: { [key: string]: string } = {
    created: 'تم الإنشاء',
    updated: 'تم التحديث',
    terminated: 'تم الإنهاء',
    recorded: 'تم التسجيل',
    late: 'متأخر',
    scheduled: 'تم الجدولة',
    completed: 'تم الإكمال',
    case_created: 'تم إنشاء القضية',
    case_updated: 'تم تحديث القضية',
    added: 'تم الإضافة',
    status_changed: 'تم تغيير الحالة',
    registered: 'تم التسجيل',
  };
  
  return labels[action] || action;
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
