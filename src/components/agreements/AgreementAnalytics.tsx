
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart4, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AgreementAnalytics() {
  return (
    <Card className="h-full" dir="rtl">
      <CardHeader className="pb-2">
        <div className="flex flex-row-reverse justify-between items-center">
          <Button variant="ghost" size="sm">
            عرض الكل
          </Button>
          <CardTitle className="text-md font-medium text-left">تحليلات العقود</CardTitle>
        </div>
        <CardDescription className="text-right">رؤى سريعة حول عقودك</CardDescription>
      </CardHeader>
      <CardContent dir="rtl">
        <div className="space-y-4">
          {/* Upcoming Expirations */}
          <div className="flex items-start space-x-reverse space-x-3 bg-muted/50 p-3 rounded-lg">
            <Calendar className="h-5 w-5 text-amber-500 mt-0.5 ml-3" />
            <div className="text-right">
              <h4 className="text-sm font-medium text-right">انتهاء صلاحية قريب</h4>
              <p className="text-xs text-muted-foreground text-right">12 عقد ستنتهي صلاحيتها خلال 30 يوماً</p>
            </div>
          </div>
          
          {/* Revenue Trend */}
          <div className="flex items-start space-x-reverse space-x-3 bg-muted/50 p-3 rounded-lg">
            <TrendingUp className="h-5 w-5 text-emerald-500 mt-0.5 ml-3" />
            <div className="text-right">
              <h4 className="text-sm font-medium text-right">زيادة في الإيرادات</h4>
              <p className="text-xs text-muted-foreground text-right">زيادة بنسبة 15% من الشهر الماضي</p>
            </div>
          </div>
          
          {/* Suggested Action */}
          <div className="flex items-start space-x-reverse space-x-3 bg-muted/50 p-3 rounded-lg">
            <BarChart4 className="h-5 w-5 text-blue-500 mt-0.5 ml-3" />
            <div className="text-right">
              <h4 className="text-sm font-medium text-right">توزيع العقود</h4>
              <p className="text-xs text-muted-foreground text-right">70% نشطة، 20% معلقة، 10% أخرى</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
