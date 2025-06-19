import React, { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/ui/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  Car, 
  CreditCard, 
  Wrench, 
  Gavel, 
  User, 
  FileText,
  Clock,
  AlertTriangle
} from 'lucide-react';

const ActivityPage = () => {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Mock data - في التطبيق الحقيقي، ستأتي هذه البيانات من API
  const activities = [
    {
      id: '1',
      type: 'rental',
      title: 'تأجير جديد',
      description: 'أحمد محمد استأجر تويوتا كامري (أ ب ج 123)',
      time: 'منذ ساعتين',
      user: 'أحمد محمد',
      metadata: { vehicleId: 'أ ب ج 123', amount: '2000 ر.ق' }
    },
    {
      id: '2',
      type: 'payment',
      title: 'دفعة مستلمة',
      description: '1500.00 ر.ق تم استلامها للعقد #LE-001',
      time: 'منذ 3 ساعات',
      user: 'فاطمة علي',
      metadata: { amount: '1500 ر.ق', agreementId: 'LE-001' }
    },
    {
      id: '3',
      type: 'maintenance',
      title: 'صيانة مجدولة',
      description: 'هوندا أكورد (س ي ن 456) مجدولة لصيانة دورية',
      time: 'منذ 5 ساعات',
      user: 'محمد السيد',
      metadata: { vehicleId: 'س ي ن 456', maintenanceType: 'صيانة دورية' }
    },
    {
      id: '4',
      type: 'legal',
      title: 'قضية قانونية جديدة',
      description: 'تم إنشاء قضية قانونية جديدة #LC-045',
      time: 'منذ يوم واحد',
      user: 'سارة أحمد',
      metadata: { caseId: 'LC-045' }
    },
    {
      id: '5',
      type: 'vehicle',
      title: 'مركبة جديدة',
      description: 'تم إضافة مركبة جديدة نيسان التيما (ق و ر 789)',
      time: 'منذ يومين',
      user: 'خالد محمود',
      metadata: { vehicleId: 'ق و ر 789' }
    },
    {
      id: '6',
      type: 'customer',
      title: 'عميل جديد',
      description: 'تم تسجيل عميل جديد علي حسن',
      time: 'منذ 3 أيام',
      user: 'منى صالح',
      metadata: { customerName: 'علي حسن' }
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'rental':
        return <Car className="h-5 w-5" />;
      case 'payment':
        return <CreditCard className="h-5 w-5" />;
      case 'maintenance':
        return <Wrench className="h-5 w-5" />;
      case 'legal':
        return <Gavel className="h-5 w-5" />;
      case 'vehicle':
        return <Car className="h-5 w-5" />;
      case 'customer':
        return <User className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'rental':
        return 'bg-blue-100 text-blue-700';
      case 'payment':
        return 'bg-green-100 text-green-700';
      case 'maintenance':
        return 'bg-orange-100 text-orange-700';
      case 'legal':
        return 'bg-purple-100 text-purple-700';
      case 'vehicle':
        return 'bg-gray-100 text-gray-700';
      case 'customer':
        return 'bg-cyan-100 text-cyan-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      rental: 'التأجير',
      payment: 'المدفوعات',
      maintenance: 'الصيانة',
      legal: 'القانونية',
      vehicle: 'المركبات',
      customer: 'العملاء'
    };
    return labels[type] || type;
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || activity.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <PageContainer
      title="سجل النشاط"
      description="عرض جميع أنشطة النظام والأحداث"

    >
      <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <PageHeader
          title="سجل النشاط"
          subtitle="تتبع جميع الأنشطة والأحداث في النظام"
          icon={<Activity className="w-6 h-6 text-blue-500" />}
          align={language === 'ar' ? 'right' : 'left'}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        />

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-right flex items-center gap-2 flex-row-reverse">
              <Filter className="h-5 w-5" />
              التصفية والبحث
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="البحث في الأنشطة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 text-right"
                />
              </div>

              {/* Type Filter */}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="تصفية حسب النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنشطة</SelectItem>
                  <SelectItem value="rental">التأجير</SelectItem>
                  <SelectItem value="payment">المدفوعات</SelectItem>
                  <SelectItem value="maintenance">الصيانة</SelectItem>
                  <SelectItem value="legal">القانونية</SelectItem>
                  <SelectItem value="vehicle">المركبات</SelectItem>
                  <SelectItem value="customer">العملاء</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range */}
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="text-right justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'LLL dd, y', { locale: ar })} -{' '}
                          {format(dateRange.to, 'LLL dd, y', { locale: ar })}
                        </>
                      ) : (
                        format(dateRange.from, 'LLL dd, y', { locale: ar })
                      )
                    ) : (
                      'اختر التاريخ'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ar}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Activity List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-right flex items-center justify-between flex-row-reverse">
              <Badge variant="secondary" className="text-right">
                {filteredActivities.length} نشاط
              </Badge>
              <span>الأنشطة الأخيرة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد أنشطة تطابق معايير البحث
                </div>
              ) : (
                filteredActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors flex-row-reverse"
                  >
                    <div className="flex-1 text-right">
                      <div className="flex items-center justify-between flex-row-reverse mb-2">
                        <span className="text-sm text-muted-foreground">{activity.time}</span>
                        <div className="flex items-center gap-2 flex-row-reverse">
                          <h3 className="font-semibold text-right">{activity.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(activity.type)}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-2 text-right">{activity.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-row-reverse">
                        <span>{activity.user}</span>
                        <span>•</span>
                        <User className="h-3 w-3" />
                      </div>
                    </div>
                    <div className={`p-3 rounded-full flex-shrink-0 ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default ActivityPage; 