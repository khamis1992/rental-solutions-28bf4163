import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Car, User, CreditCard, Wrench, AlertTriangle, Clock, Filter } from 'lucide-react';
import { RecentActivity as RecentActivityType } from '@/hooks/use-dashboard';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from '@/utils/translation-helper';
import { useLanguage } from '@/contexts/LanguageContext';

interface RecentActivityProps {
  activities: RecentActivityType[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string | null>(null);
  const { t } = useTranslation();
  const { language } = useLanguage();

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

  // Apply filter to activities if filter is set
  const filteredActivities = filter 
    ? activities.filter(activity => activity.type === filter)
    : activities;

  const getFilterLabel = (filterType: string) => {
    const labels: { [key: string]: string } = {
      'rental': 'التأجير',
      'payment': 'المدفوعات',
      'maintenance': 'الصيانة',
      'fine': 'المخالفات'
    };
    return labels[filterType] || filterType;
  };

  return (
    <Card className="col-span-4 card-transition dashboard-card" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-2 flex flex-row items-start justify-between flex-row-reverse">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2 flex-row-reverse">
              <Filter className="h-3.5 w-3.5" />
              تصفية
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-right">تصفية حسب النوع</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setFilter(null)} className="text-right">
              جميع الأنشطة
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('rental')} className="flex items-center gap-2 flex-row-reverse text-right">
              <Car className="h-3.5 w-3.5" />
              التأجير
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('payment')} className="flex items-center gap-2 flex-row-reverse text-right">
              <CreditCard className="h-3.5 w-3.5" />
              المدفوعات
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('maintenance')} className="flex items-center gap-2 flex-row-reverse text-right">
              <Wrench className="h-3.5 w-3.5" />
              الصيانة
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter('fine')} className="flex items-center gap-2 flex-row-reverse text-right">
              <AlertTriangle className="h-3.5 w-3.5" />
              المخالفات
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="text-right">
          <CardTitle className="text-right">النشاط الأخير</CardTitle>
          {filter && (
            <Badge 
              variant="outline" 
              className="mt-1 cursor-pointer text-right"
              onClick={() => setFilter(null)}
            >
              مُصفى حسب: {getFilterLabel(filter)} ×
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {filter ? `لا توجد أنشطة من نوع ${getFilterLabel(filter)}` : 'لا توجد أنشطة حديثة'}
          </div>
        ) : (
          <div className="space-y-5">
            {filteredActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors flex-row-reverse"
                onClick={() => handleActivityClick(activity)}
              >
                <div className="flex-1 text-right pr-4">
                  <div className="flex items-center justify-between flex-row-reverse">
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                    <h4 className="font-medium text-right">{activity.title}</h4>
                  </div>
                  <p className="text-muted-foreground mt-1 text-right">{activity.description}</p>
                  <div className="mt-2 text-right">
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="h-auto p-0 text-xs text-primary"
                    >
                      عرض التفاصيل ←
                    </Button>
                  </div>
                </div>
                <div className={`p-2 rounded-full ${getActivityColor(activity.type)} flex-shrink-0`}>
                  {getActivityIcon(activity.type)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button variant="outline" className="w-full text-right" onClick={() => navigate('/activity')}>
          عرض جميع الأنشطة
        </Button>
      </CardFooter>
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
