import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FileText, CreditCard, Wrench, UserPlus, Car, BarChart3 } from 'lucide-react';
import { RecordPaymentDialog } from '@/components/payments/RecordPaymentDialog';
import { useTranslation } from '@/utils/translation-helper';
import { useLanguage } from '@/contexts/LanguageContext';

export const QuickActions = () => {
  const navigate = useNavigate();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const { t } = useTranslation();
  const { language } = useLanguage();
  
  const quickActions = [
    {
      title: "عقد جديد",
      description: "إنشاء اتفاقية إيجار جديدة",
      icon: <FileText className="h-5 w-5" />,
      href: "/agreements/add",
      bgColor: "bg-blue-500",
      hoverColor: "hover:bg-blue-600"
    },
    {
      title: "إضافة عميل",
      description: "تسجيل عميل جديد",
      icon: <UserPlus className="h-5 w-5" />,
      href: "/customers/add",
      bgColor: "bg-green-500", 
      hoverColor: "hover:bg-green-600"
    },
    {
      title: "إضافة مركبة",
      description: "إضافة مركبة جديدة للأسطول",
      icon: <Car className="h-5 w-5" />,
      href: "/vehicles/add",
      bgColor: "bg-purple-500",
      hoverColor: "hover:bg-purple-600"
    },
    {
      title: "التقارير",
      description: "عرض التقارير والإحصائيات",
      icon: <BarChart3 className="h-5 w-5" />,
      href: "/reports",
      bgColor: "bg-orange-500",
      hoverColor: "hover:bg-orange-600"
    }
  ];

  return (
    <>
      <Card className="mb-6 border border-border/60 shadow-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <CardHeader className="pb-2">
          <CardTitle className={`text-lg font-medium ${language === 'ar' ? 'text-right' : ''}`}>
            الإجراءات السريعة
          </CardTitle>
          <CardDescription className={language === 'ar' ? 'text-right' : ''}>
            الوصول السريع للمهام الأساسية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.title}
                variant="outline"
                className="h-auto py-4 justify-start flex flex-col items-center text-center hover:bg-accent/5"
                onClick={() => navigate(action.href)}
              >
                <div className={`rounded-full p-2 ${action.bgColor} bg-opacity-10 mb-2`}>
                  {action.icon}
                </div>
                <span className="text-sm font-medium">{action.title}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <RecordPaymentDialog 
        open={showPaymentDialog} 
        onOpenChange={setShowPaymentDialog} 
      />
    </>
  );
};
