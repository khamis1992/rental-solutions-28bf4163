
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const COLORS = ['#ef4444', '#f59e0b', '#10b981'];
const STATUS_COLORS: Record<string, string> = {
  pending: '#ef4444',
  disputed: '#f59e0b',
  paid: '#10b981'
};

const TrafficFineAnalytics = () => {
  const { trafficFines, isLoading } = useTrafficFines();
  const { language } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className={`flex items-center ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
          <Loader2 className={`h-8 w-8 animate-spin ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
          <span>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</span>
        </div>
      </div>
    );
  }

  // Prepare data for the status distribution chart
  const statusDistribution = [
    { name: language === 'ar' ? 'معلقة' : 'Pending', value: 0, color: '#ef4444' },
    { name: language === 'ar' ? 'متنازع عليها' : 'Disputed', value: 0, color: '#f59e0b' },
    { name: language === 'ar' ? 'مدفوعة' : 'Paid', value: 0, color: '#10b981' }
  ];

  trafficFines?.forEach(fine => {
    switch (fine.paymentStatus) {
      case 'pending':
        statusDistribution[0].value += 1;
        break;
      case 'disputed':
        statusDistribution[1].value += 1;
        break;
      case 'paid':
        statusDistribution[2].value += 1;
        break;
    }
  });

  // Calculate financial metrics
  const totalFineAmount = trafficFines?.reduce((sum, fine) => sum + fine.fineAmount, 0) || 0;
  const pendingAmount = trafficFines?.filter(fine => fine.paymentStatus === 'pending')
    .reduce((sum, fine) => sum + fine.fineAmount, 0) || 0;
  const paidAmount = trafficFines?.filter(fine => fine.paymentStatus === 'paid')
    .reduce((sum, fine) => sum + fine.fineAmount, 0) || 0;
  const disputedAmount = trafficFines?.filter(fine => fine.paymentStatus === 'disputed')
    .reduce((sum, fine) => sum + fine.fineAmount, 0) || 0;

  // Prepare data for the monthly trend chart
  const monthlyData: { [key: string]: { month: string, pending: number, paid: number, disputed: number } } = {};
  
  trafficFines?.forEach(fine => {
    const month = new Date(fine.violationDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
    
    if (!monthlyData[month]) {
      monthlyData[month] = { month, pending: 0, paid: 0, disputed: 0 };
    }
    
    monthlyData[month][fine.paymentStatus as keyof typeof monthlyData[string]]++;
  });

  const monthlyTrend = Object.values(monthlyData);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-2 shadow-lg" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <p className={`font-semibold ${language === 'ar' ? 'text-right' : ''}`}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className={language === 'ar' ? 'text-right' : ''}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'إجمالي المخالفات' : 'Total Fines'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${language === 'ar' ? 'text-right' : ''}`}>
              {trafficFines?.length || 0}
            </div>
            <p className={`text-xs text-muted-foreground ${language === 'ar' ? 'text-right' : ''}`}>
              {formatCurrency(totalFineAmount)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'مخالفات معلقة' : 'Pending Fines'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-red-600 ${language === 'ar' ? 'text-right' : ''}`}>
              {statusDistribution[0].value}
            </div>
            <p className={`text-xs text-muted-foreground ${language === 'ar' ? 'text-right' : ''}`}>
              {formatCurrency(pendingAmount)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'مخالفات مدفوعة' : 'Paid Fines'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-green-600 ${language === 'ar' ? 'text-right' : ''}`}>
              {statusDistribution[2].value}
            </div>
            <p className={`text-xs text-muted-foreground ${language === 'ar' ? 'text-right' : ''}`}>
              {formatCurrency(paidAmount)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${language === 'ar' ? 'text-right' : ''}`}>
              {language === 'ar' ? 'مخالفات متنازع عليها' : 'Disputed Fines'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-amber-600 ${language === 'ar' ? 'text-right' : ''}`}>
              {statusDistribution[1].value}
            </div>
            <p className={`text-xs text-muted-foreground ${language === 'ar' ? 'text-right' : ''}`}>
              {formatCurrency(disputedAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'توزيع حالة المخالفات' : 'Fine Status Distribution'}
            </CardTitle>
            <CardDescription className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'نسبة المخالفات حسب الحالة' : 'Breakdown of fines by payment status'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label={({ name, value, percent }) => 
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'الاتجاه الشهري للمخالفات' : 'Monthly Fine Trend'}
            </CardTitle>
            <CardDescription className={language === 'ar' ? 'text-right' : ''}>
              {language === 'ar' ? 'توزيع المخالفات حسب الشهر والحالة' : 'Fine distribution by month and status'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrend}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="pending" 
                  fill="#ef4444" 
                  name={language === 'ar' ? 'معلقة' : 'Pending'} 
                />
                <Bar 
                  dataKey="disputed" 
                  fill="#f59e0b" 
                  name={language === 'ar' ? 'متنازع عليها' : 'Disputed'} 
                />
                <Bar 
                  dataKey="paid" 
                  fill="#10b981" 
                  name={language === 'ar' ? 'مدفوعة' : 'Paid'} 
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrafficFineAnalytics;
