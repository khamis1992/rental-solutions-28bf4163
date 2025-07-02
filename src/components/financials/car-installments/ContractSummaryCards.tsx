import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Layers, DollarSign, CreditCard, Clock } from 'lucide-react';
import { ContractSummary } from '@/types/car-installment';
import { formatCurrency } from '@/lib/utils';
import { StatCard } from '@/components/ui/stat-card';
import { useLanguage } from '@/contexts/LanguageContext';

interface ContractSummaryCardsProps {
  summary?: ContractSummary;
  isLoading: boolean;
}

export const ContractSummaryCards: React.FC<ContractSummaryCardsProps> = ({ 
  summary, 
  isLoading 
}) => {
  const { language } = useLanguage();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
              <div className="h-6 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className={`rounded-md bg-muted p-4 text-center ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {language === 'ar' ? 'لا توجد بيانات عقود متاحة' : 'No contract data available'}
      </div>
    );
  }

  const summaryCards = [
    {
      title: language === 'ar' ? 'العقود النشطة' : 'Active Contracts',
      value: summary.totalContracts,
      icon: Layers,
      iconClass: 'text-blue-500',
      format: (value: number) => value.toString()
    },
    {
      title: language === 'ar' ? 'قيمة المحفظة' : 'Portfolio Value',
      value: summary.totalPortfolioValue,
      icon: DollarSign,
      iconClass: 'text-green-500',
      format: (value: number) => formatCurrency(value)
    },
    {
      title: language === 'ar' ? 'إجمالي التحصيلات' : 'Total Collections',
      value: summary.totalCollections,
      icon: CreditCard,
      iconClass: 'text-purple-500',
      format: (value: number) => formatCurrency(value)
    },
    {
      title: language === 'ar' ? 'المدفوعات القادمة' : 'Upcoming Payments',
      value: summary.upcomingPayments,
      icon: Clock,
      iconClass: 'text-amber-500',
      format: (value: number) => formatCurrency(value)
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {summaryCards.map((card, index) => (
        <StatCard
          key={index}
          title={card.title}
          value={card.format(card.value)}
          icon={card.icon}
          iconColor={card.iconClass}
          className={language === 'ar' ? 'text-right' : 'text-left'}
        />
      ))}
    </div>
  );
};
