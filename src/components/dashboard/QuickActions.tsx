import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FileText, UserPlus, Car, TrendingUp, Gavel } from 'lucide-react';
import { RecordPaymentDialog } from '@/components/payments/RecordPaymentDialog';
import { useTranslation } from '@/utils/translation-helper';
import { useLanguage } from '@/contexts/LanguageContext';

export const QuickActions = () => {
  const navigate = useNavigate();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  const quickActions = [
    {
      id: "new-agreement",
      title: "عقد جديد",
      description: "إنشاء اتفاقية إيجار جديدة",
      icon: <FileText className="h-5 w-5" />,
      href: "/agreements/add",
      bgColor: "bg-blue-500"
    },
    {
      id: "add-customer",
      title: "إضافة عميل",
      description: "تسجيل عميل جديد",
      icon: <UserPlus className="h-5 w-5" />,
      href: "/customers/add",
      bgColor: "bg-green-500"
    },
    {
      id: "add-vehicle",
      title: "إضافة مركبة",
      description: "إضافة مركبة جديدة للأسطول",
      icon: <Car className="h-5 w-5" />,
      href: "/vehicles/add",
      bgColor: "bg-purple-500"
    },
    {
      id: "legal-management",
      title: "الإدارة القانونية",
      description: "القضايا والتنبيهات القانونية",
      icon: <Gavel className="h-5 w-5" />,
      href: "/legal",
      bgColor: "bg-red-500"
    },
    {
      id: "quick-reports",
      title: "تقارير سريعة",
      description: "تحليلات وتقارير فورية",
      icon: <TrendingUp className="h-5 w-5" />,
      href: "/reports",
      bgColor: "bg-orange-500"
    }
  ];

  return (
    <>
      <Card className="mb-6 border border-border/60 shadow-sm" dir="rtl">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-right">
            الإجراءات السريعة
          </CardTitle>
          <CardDescription className="text-right">
            الوصول السريع للمهام الأساسية، التقارير، والقضايا القانونية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.id}
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