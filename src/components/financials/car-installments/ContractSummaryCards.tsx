
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Layers, DollarSign, CreditCard, Clock } from 'lucide-react';
import { ContractSummary } from '@/types/car-installment';
import { formatCurrency } from '@/lib/utils';
import { StatCard } from '@/components/ui/stat-card';

interface ContractSummaryCardsProps {
  summary?: ContractSummary;
  isLoading: boolean;
}

export const ContractSummaryCards: React.FC<ContractSummaryCardsProps> = ({ 
  summary, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="rounded-md bg-muted p-4 text-center">
        No contract data available
      </div>
    );
  }

  const summaryCards = [
    {
      title: 'Active Contracts',
      value: summary.totalContracts,
      icon: Layers,
      iconClass: 'text-blue-500',
      format: (value: number) => value.toString()
    },
    {
      title: 'Portfolio Value',
      value: summary.totalPortfolioValue,
      icon: DollarSign,
      iconClass: 'text-green-500',
      format: formatCurrency
    },
    {
      title: 'Total Collections',
      value: summary.totalCollections,
      icon: CreditCard,
      iconClass: 'text-purple-500',
      format: formatCurrency
    },
    {
      title: 'Upcoming Payments',
      value: summary.upcomingPayments,
      icon: Clock,
      iconClass: 'text-amber-500',
      format: formatCurrency
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryCards.map((card, index) => (
        <StatCard
          key={index}
          title={card.title}
          value={card.format(card.value)}
          icon={card.icon}
          iconColor={card.iconClass}
        />
      ))}
    </div>
  );
};
