
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, User, CreditCard, Wrench, AlertTriangle, Clock } from 'lucide-react';
import { RecentActivity as RecentActivityType } from '@/hooks/use-dashboard';
import { useNavigate } from 'react-router-dom';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';
import { getDirectionalClasses, getDirectionalFlexClass, getIconTextOrder } from '@/utils/rtl-utils';

interface RecentActivityProps {
  activities: RecentActivityType[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const navigate = useNavigate();
  const { t } = useI18nTranslation();
  const { isRTL } = useTranslation();
  const { iconOrder, textOrder } = getIconTextOrder();

  const handleActivityClick = (activity: RecentActivityType) => {
    // Navigate to the relevant page based on activity type
    if (activity.type === 'rental' || activity.type === 'return') {
      navigate(`/agreements/${activity.id}`);
    } else if (activity.type === 'payment') {
      navigate(`/financials`);
    } else if (activity.type === 'maintenance') {
      navigate(`/maintenance/${activity.id}`);
    } else if (activity.type === 'fine') {
      navigate(`/fines`);
    }
  };

  // Dictionary for activity type translations
  const activityTypeTranslations = {
    rental: t('dashboard.activityTypes.rental'),
    return: t('dashboard.activityTypes.return'),
    payment: t('dashboard.activityTypes.payment'),
    maintenance: t('dashboard.activityTypes.maintenance'),
    fine: t('dashboard.activityTypes.fine')
  };

  return (
    <Card className="col-span-4 card-transition">
      <CardHeader>
        <CardTitle className={isRTL ? 'text-right' : ''}>{t('dashboard.recentActivity')}</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {t('common.noResults')}
          </div>
        ) : (
          <div className="space-y-5">
            {activities.map((activity) => (
              <div 
                key={activity.id} 
                className={`flex ${getDirectionalFlexClass()} items-start cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors`}
                onClick={() => handleActivityClick(activity)}
              >
                <div className={`p-2 rounded-full ${getActivityColor(activity.type)} ${isRTL ? 'order-2 ml-4' : 'order-1 mr-4'}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className={`flex-1 ${isRTL ? 'order-1' : 'order-2'}`}>
                  <div className={`flex ${getDirectionalFlexClass()} items-center justify-between`}>
                    <h4 className="font-medium">
                      {activityTypeTranslations[activity.type as keyof typeof activityTypeTranslations] || activity.title}
                    </h4>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                  <p className={`text-muted-foreground mt-1 ${isRTL ? 'text-right' : ''}`}>{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'rental':
      return <Car className="h-5 w-5" />;
    case 'return':
      return <Clock className="h-5 w-5" />;
    case 'payment':
      return <CreditCard className="h-5 w-5" />;
    case 'maintenance':
      return <Wrench className="h-5 w-5" />;
    case 'fine':
      return <AlertTriangle className="h-5 w-5" />;
    default:
      return <User className="h-5 w-5" />;
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case 'rental':
      return 'bg-blue-100 text-blue-700';
    case 'return':
      return 'bg-green-100 text-green-700';
    case 'payment':
      return 'bg-violet-100 text-violet-700';
    case 'maintenance':
      return 'bg-amber-100 text-amber-700';
    case 'fine':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export default RecentActivity;
