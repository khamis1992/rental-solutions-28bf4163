import React from 'react';
import { useLegalCases } from '@/hooks/legal/useLegalCases';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

const LegalDashboard: React.FC = () => {
  const { legalCases, isLoading, error } = useLegalCases();

  // Calculate stats
  const totalCases = legalCases.length;
  const openCases = legalCases.filter(c => c.status === 'active' || c.status === 'pending').length;
  const resolvedCases = legalCases.filter(c => c.status === 'resolved').length;
  const highPriorityCases = legalCases.filter(c => c.priority === 'high').length;

  // Get 5 most recent cases
  const recentCases = [...legalCases]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary ml-2" />
        <span className="text-muted-foreground">جاري تحميل لوحة التحكم...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center bg-red-50 p-4 rounded" dir="rtl">
        <AlertTriangle className="h-5 w-5 text-red-500 ml-2" />
        <span className="text-red-700">خطأ في تحميل لوحة التحكم: {error instanceof Error ? error.message : String(error)}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-right">إجمالي القضايا</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-right">{totalCases}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-right">القضايا المفتوحة</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-right">{openCases}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-right">القضايا المحلولة</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-right">{resolvedCases}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-right">عالية الأولوية</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-right">{highPriorityCases}</span>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases */}
      <div>
        <h3 className="text-lg font-semibold mb-2 text-right">القضايا الحديثة</h3>
        {recentCases.length === 0 ? (
          <div className="text-muted-foreground text-right">لا توجد قضايا حديثة.</div>
        ) : (
          <div className="space-y-2">
            {recentCases.map((c) => (
              <Card key={c.id} className="border p-2">
                <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="text-right">
                    <div className="font-medium text-right">{c.description || c.id}</div>
                    <div className="text-xs text-muted-foreground text-right">{formatDate(c.created_at)}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <Badge variant="outline">{getStatusBadge(c.status || 'غير معروف')}</Badge>
                    <Badge variant="outline">{getPriorityBadge(c.priority || 'غير معروف')}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions to translate status and priority
const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'نشطة';
    case 'pending':
      return 'معلقة';
    case 'resolved':
      return 'محلولة';
    case 'closed':
      return 'مغلقة';
    case 'escalated':
      return 'مصعدة';
    default:
      return status;
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'عالية';
    case 'medium':
      return 'متوسطة';
    case 'low':
      return 'منخفضة';
    case 'critical':
      return 'حرجة';
    default:
      return priority;
  }
};

export default LegalDashboard;
