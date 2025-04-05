
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer 
} from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';
import { useTranslation as useAppTranslation } from '@/contexts/TranslationContext';

// Sample data for demonstration
const monthlyData = [
  { name: 'Jan', fines: 12 },
  { name: 'Feb', fines: 19 },
  { name: 'Mar', fines: 15 },
  { name: 'Apr', fines: 22 },
  { name: 'May', fines: 30 },
  { name: 'Jun', fines: 18 },
];

const statusData = [
  { name: 'Pending', value: 65 },
  { name: 'Paid', value: 30 },
  { name: 'Disputed', value: 5 },
];

const typeData = [
  { name: 'Speeding', value: 45 },
  { name: 'Parking', value: 25 },
  { name: 'Red Light', value: 15 },
  { name: 'Other', value: 15 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#9370DB'];

const TrafficFineAnalytics = () => {
  const { t } = useTranslation();
  const { isRTL } = useAppTranslation();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t('trafficFines.finesByMonth')}</CardTitle>
            <CardDescription>{t('trafficFines.violationsOverTime')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={isRTL ? [...monthlyData].reverse() : monthlyData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="fines" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t('trafficFines.finesByStatus')}</CardTitle>
            <CardDescription>{t('trafficFines.fineStatusDistribution')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t('trafficFines.finesByType')}</CardTitle>
            <CardDescription>{t('trafficFines.topViolations')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('trafficFines.analytics')}</AlertTitle>
            <AlertDescription>
              {t('trafficFines.collectMoreData')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrafficFineAnalytics;
