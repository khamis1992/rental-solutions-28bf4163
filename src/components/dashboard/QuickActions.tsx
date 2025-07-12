import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { FileText, Car, TrendingUp, Gavel, UserPlus, Scan, LucideIcon } from 'lucide-react';
import { RecordPaymentDialog } from '@/components/payments/RecordPaymentDialog';
import { useTranslation } from '@/utils/translation-helper';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  bgColor: string;
}

export const QuickActions = () => {
  const navigate = useNavigate();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  
  const quickActions: QuickAction[] = [
    {
      id: "new-agreement",
      title: "عقد جديد",
      description: "إنشاء اتفاقية إيجار جديدة",
      icon: FileText,
      href: "/agreements/add",
      bgColor: "bg-blue-500"
    },
    {
      id: "add-customer",
      title: "إضافة عميل",
      description: "إضافة عميل جديد للنظام",
      icon: UserPlus,
      href: "/customers?action=add",
      bgColor: "bg-purple-500"
    },
    {
      id: "invoice-scanner",
      title: "مسح الفواتير",
      description: "مسح وإدخال الفواتير تلقائياً",
      icon: Scan,
      href: "/invoice-management",
      bgColor: "bg-green-500"
    },
    {
      id: "legal-management",
      title: "الإدارة القانونية",
      description: "القضايا والتنبيهات القانونية",
      icon: Gavel,
      href: "/legal",
      bgColor: "bg-red-500"
    }
  ];

  return (
    <>
      <Card className="relative overflow-hidden bg-gradient-to-br from-background via-muted/20 to-background border-border/40 shadow-sm hover:shadow-md transition-all duration-300" dir="rtl">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-transparent to-secondary/[0.02]"></div>
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-primary/5 rounded-full blur-2xl"></div>
        
        <CardHeader className="relative pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold text-right text-foreground">
                الإجراءات السريعة
              </CardTitle>
              <CardDescription className="text-right text-muted-foreground mt-1">
                الوصول المباشر للمهام الرئيسية وأدوات الإدارة
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="relative">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  className="group relative h-auto py-6 px-4 flex flex-col items-center text-center border-border/50 hover:border-primary/30 hover:bg-accent/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
                  onClick={() => navigate(action.href)}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  {/* Background gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></div>
                  
                  <div className="relative flex flex-col items-center gap-3">
                    <div className={`relative p-3 rounded-xl ${action.bgColor}/10 border border-current/20 group-hover:scale-110 transition-transform duration-300`}>
                      <div className={`${action.bgColor.replace('bg-', 'text-')}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                        {action.title}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1 leading-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Button>
              );
            })}
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