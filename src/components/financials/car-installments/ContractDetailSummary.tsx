import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CarInstallmentContract } from '@/types/car-installment';
import { formatCurrency } from '@/lib/utils';
import { CalendarClock, CreditCard, AlertCircle, CircleDollarSign } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ContractDetailSummaryProps {
  contract: CarInstallmentContract;
}

export const ContractDetailSummary: React.FC<ContractDetailSummaryProps> = ({ contract }) => {
  const { language } = useLanguage();
  
  // Calculate payment progress percentage
  const progressPercentage = 
    contract.total_contract_value === 0 
      ? 0 
      : Math.round((contract.amount_paid / contract.total_contract_value) * 100);

  const summaryCards = [
    {
      title: language === 'ar' ? 'إجمالي مبلغ العقد' : 'Total Contract Amount',
      value: formatCurrency(contract.total_contract_value),
      icon: CircleDollarSign,
      color: 'text-blue-500',
      progress: progressPercentage,
      progressColor: progressPercentage >= 75 
        ? 'bg-green-500' 
        : progressPercentage >= 50 
          ? 'bg-emerald-500' 
          : progressPercentage >= 25 
            ? 'bg-blue-500' 
            : 'bg-amber-500'
    },
    {
      title: language === 'ar' ? 'إجمالي المبلغ المدفوع' : 'Total Paid Amount',
      value: formatCurrency(contract.amount_paid),
      icon: CreditCard,
      color: 'text-green-500'
    },
    {
      title: language === 'ar' ? 'المبلغ المعلق' : 'Pending Amount',
      value: formatCurrency(contract.amount_pending),
      icon: CalendarClock,
      color: 'text-amber-500'
    },
    {
      title: language === 'ar' ? 'المدفوعات المتأخرة' : 'Overdue Payments',
      value: contract.overdue_payments.toString(),
      icon: AlertCircle,
      color: 'text-red-500',
      highlight: contract.overdue_payments > 0
    }
  ];

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className={`flex items-center mb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={`${language === 'ar' ? 'ml-2' : 'mr-2'} ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <p className={`text-sm font-medium text-muted-foreground ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {card.title}
                </p>
              </div>
              <h3 className={`text-2xl font-bold ${card.highlight ? 'text-red-500' : ''} ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                {card.value}
              </h3>
              {card.progress !== undefined && (
                <div className="mt-3">
                  <div className={`flex justify-between mb-1 text-xs ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <span>{language === 'ar' ? 'تقدم الدفع' : 'Payment Progress'}</span>
                    <span>{card.progress}%</span>
                  </div>
                  <Progress value={card.progress} className={`h-2 ${card.progressColor}`} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <h3 className={`text-lg font-semibold mb-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {language === 'ar' ? 'تفاصيل العقد' : 'Contract Details'}
            </h3>
            <div className="space-y-2">
              <div className={`flex justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span className={`text-muted-foreground ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' ? 'نوع السيارة:' : 'Car Type:'}
                </span>
                <span className={`font-medium ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                  {contract.car_type}
                </span>
              </div>
              <div className={`flex justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span className={`text-muted-foreground ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' ? 'سنة الموديل:' : 'Model Year:'}
                </span>
                <span className={`font-medium ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                  {contract.model_year}
                </span>
              </div>
              <div className={`flex justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span className={`text-muted-foreground ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' ? 'عدد السيارات:' : 'Number of Cars:'}
                </span>
                <span className={`font-medium ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                  {contract.number_of_cars}
                </span>
              </div>
              <div className={`flex justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span className={`text-muted-foreground ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' ? 'السعر لكل سيارة:' : 'Price per Car:'}
                </span>
                <span className={`font-medium ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                  {formatCurrency(contract.price_per_car)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className={`text-lg font-semibold mb-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {language === 'ar' ? 'ملخص الدفع' : 'Payment Summary'}
            </h3>
            <div className="space-y-2">
              <div className={`flex justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span className={`text-muted-foreground ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' ? 'إجمالي الأقساط:' : 'Total Installments:'}
                </span>
                <span className={`font-medium ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                  {contract.total_installments}
                </span>
              </div>
              <div className={`flex justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span className={`text-muted-foreground ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' ? 'الأقساط المتبقية:' : 'Remaining Installments:'}
                </span>
                <span className={`font-medium ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                  {contract.remaining_installments}
                </span>
              </div>
              <div className={`flex justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span className={`text-muted-foreground ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' ? 'الأقساط المكتملة:' : 'Completed Installments:'}
                </span>
                <span className={`font-medium ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                  {contract.total_installments - contract.remaining_installments}
                </span>
              </div>
              <div className={`flex justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span className={`text-muted-foreground ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {language === 'ar' ? 'قيمة القسط:' : 'Installment Value:'}
                </span>
                <span className={`font-medium ${language === 'ar' ? 'text-left' : 'text-right'}`}>
                  {formatCurrency(contract.installment_value)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
