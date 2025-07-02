
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

import { Gavel, CalendarDays, ShieldAlert, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const RecentLegalActivity = () => {
  const { language } = useLanguage();
  
  return (
    <Card className="md:col-span-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-right">النشاط القانوني الحديث</CardTitle>
        <CardDescription className="text-right">آخر التحديثات والتغييرات</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 max-h-[320px] overflow-y-auto pl-1">
          <div className="flex gap-4 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors flex-row-reverse">
            <div className="flex-1 text-right">
              <div className="flex justify-between flex-row-reverse">
                <Badge variant="outline" className="text-xs">منذ ساعتين</Badge>
                <h4 className="font-medium text-right">قضية جديدة تم إنشاؤها</h4>
              </div>
              <p className="text-sm text-muted-foreground text-right">قضية تعثر في الدفع تم فتحها للعميل #1254</p>
              <Button variant="link" className="p-0 h-6 mt-1 text-xs text-right">← عرض تفاصيل القضية</Button>
            </div>
            <div className="p-2 rounded-full bg-primary/10 h-10 w-10 flex items-center justify-center flex-shrink-0">
              <Gavel className="h-5 w-5 text-primary" />
            </div>
          </div>
          
          <div className="flex gap-4 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors flex-row-reverse">
            <div className="flex-1 text-right">
              <div className="flex justify-between flex-row-reverse">
                <Badge variant="outline" className="text-xs">أمس</Badge>
                <h4 className="font-medium text-right">تم تحديد موعد المحكمة</h4>
              </div>
              <p className="text-sm text-muted-foreground text-right">جلسة القضية #LC-283 مجدولة ليوم 15 يونيو</p>
              <Button variant="link" className="p-0 h-6 mt-1 text-xs text-right">← عرض التقويم</Button>
            </div>
            <div className="p-2 rounded-full bg-amber-500/10 h-10 w-10 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          
          <div className="flex gap-4 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors flex-row-reverse">
            <div className="flex-1 text-right">
              <div className="flex justify-between flex-row-reverse">
                <Badge variant="outline" className="text-xs">منذ يومين</Badge>
                <h4 className="font-medium text-right">تم حل القضية</h4>
              </div>
              <p className="text-sm text-muted-foreground text-right">قضية أضرار المركبة #LC-276 تم تسويتها مع العميل</p>
              <Button variant="link" className="p-0 h-6 mt-1 text-xs text-right">← عرض التسوية</Button>
            </div>
            <div className="p-2 rounded-full bg-green-500/10 h-10 w-10 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="h-5 w-5 text-green-500" />
            </div>
          </div>
          
          <div className="flex gap-4 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors flex-row-reverse">
            <div className="flex-1 text-right">
              <div className="flex justify-between flex-row-reverse">
                <Badge variant="outline" className="text-xs">منذ 3 أيام</Badge>
                <h4 className="font-medium text-right">تم تحديث الوثيقة</h4>
              </div>
              <p className="text-sm text-muted-foreground text-right">تم تنقيح نموذج العقد للمركبات التجارية</p>
              <Button variant="link" className="p-0 h-6 mt-1 text-xs text-right">← عرض الوثيقة</Button>
            </div>
            <div className="p-2 rounded-full bg-blue-500/10 h-10 w-10 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-500" />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full text-right">عرض جميع الأنشطة</Button>
      </CardFooter>
    </Card>
  );
};
