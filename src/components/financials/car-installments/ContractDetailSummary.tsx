
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CarInstallmentContract } from '@/types/car-installment';
import { formatCurrency } from '@/lib/utils';
import { CalendarClock, CreditCard, AlertCircle, CircleDollarSign } from 'lucide-react';

interface ContractDetailSummaryProps {
  contract: CarInstallmentContract;
}

export const ContractDetailSummary: React.FC<ContractDetailSummaryProps> = ({ contract }) => {
  // Calculate payment progress percentage
  const progressPercentage = 
    contract.total_contract_value === 0 
      ? 0 
      : Math.round((contract.amount_paid / contract.total_contract_value) * 100);

  const summaryCards = [
    {
      title: 'Total Contract Amount',
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
      title: 'Total Paid Amount',
      value: formatCurrency(contract.amount_paid),
      icon: CreditCard,
      color: 'text-green-500'
    },
    {
      title: 'Pending Amount',
      value: formatCurrency(contract.amount_pending),
      icon: CalendarClock,
      color: 'text-amber-500'
    },
    {
      title: 'Overdue Payments',
      value: contract.overdue_payments.toString(),
      icon: AlertCircle,
      color: 'text-red-500',
      highlight: contract.overdue_payments > 0
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center mb-2">
                <div className={`mr-2 ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
              </div>
              <h3 className={`text-2xl font-bold ${card.highlight ? 'text-red-500' : ''}`}>
                {card.value}
              </h3>
              {card.progress !== undefined && (
                <div className="mt-3">
                  <div className="flex justify-between mb-1 text-xs">
                    <span>Payment Progress</span>
                    <span>{card.progress}%</span>
                  </div>
                  <Progress value={card.progress} className="h-2" indicatorClassName={card.progressColor} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Contract Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Car Type:</span>
                <span className="font-medium">{contract.car_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Model Year:</span>
                <span className="font-medium">{contract.model_year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Number of Cars:</span>
                <span className="font-medium">{contract.number_of_cars}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price per Car:</span>
                <span className="font-medium">{formatCurrency(contract.price_per_car)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Installments:</span>
                <span className="font-medium">{contract.total_installments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining Installments:</span>
                <span className="font-medium">{contract.remaining_installments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed Installments:</span>
                <span className="font-medium">{contract.total_installments - contract.remaining_installments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Installment Value:</span>
                <span className="font-medium">{formatCurrency(contract.installment_value)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
