
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MobileTabs } from '@/components/ui/mobile-tabs';
import { FileText, CreditCard, Gavel, AlertTriangle } from 'lucide-react';
import { Payment } from '../agreements/PaymentHistory';
import { Agreement } from '@/lib/validation-schemas/agreement';

interface AgreementTabsProps {
  agreement: Agreement;
  children: React.ReactNode;
  payments: Payment[];
  isLoadingPayments: boolean;
  rentAmount: number | null;
  onPaymentDeleted: () => void;
  onRefreshPayments: () => void;
}

export function AgreementTabs({
  agreement,
  children,
  payments,
  isLoadingPayments,
  rentAmount,
  onPaymentDeleted,
  onRefreshPayments
}: AgreementTabsProps) {
  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: <FileText className="h-4 w-4" />,
      content: children
    },
    {
      id: "payments",
      label: "Payments",
      icon: <CreditCard className="h-4 w-4" />,
      content: (
        <div className="mt-4">
          {React.Children.map(children, child => {
            // Find the PaymentHistory component and only render it
            if (React.isValidElement(child) && 
                child.type &&
                // @ts-ignore - checking component display name
                (child.type.displayName === 'PaymentHistory' || 
                 // @ts-ignore
                 child.type.name === 'PaymentHistory')) {
              return child;
            }
            return null;
          })}
        </div>
      )
    },
    {
      id: "legal",
      label: "Legal Cases",
      icon: <Gavel className="h-4 w-4" />,
      content: (
        <div className="mt-4">
          {React.Children.map(children, child => {
            // Find the LegalCaseCard component and only render it
            if (React.isValidElement(child) && 
                child.props && 
                child.props.agreementId &&
                // @ts-ignore - checking component display name  
                (child.type.displayName === 'LegalCaseCard' || 
                 // @ts-ignore
                 child.type.name === 'LegalCaseCard')) {
              return child;
            }
            return null;
          })}
        </div>
      )
    },
    {
      id: "fines",
      label: "Traffic Fines",
      icon: <AlertTriangle className="h-4 w-4" />,
      content: (
        <div className="mt-4">
          {React.Children.map(children, child => {
            // Find the AgreementTrafficFines component and only render it
            if (React.isValidElement(child) && 
                child.props && 
                child.props.agreementId &&
                // @ts-ignore - checking component type
                (child.type.displayName === 'AgreementTrafficFines' || 
                 // @ts-ignore
                 child.type.name === 'AgreementTrafficFines')) {
              return child;
            }
            return null;
          })}
        </div>
      )
    }
  ];

  return (
    <div className="w-full mt-6">
      {/* Desktop view - uses standard Tabs */}
      <div className="hidden md:block">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="animate-fade-in">
              {tab.id === "overview" ? children : tab.content}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      {/* Mobile view - custom component */}
      <div className="md:hidden">
        <MobileTabs tabs={tabs} defaultValue="overview" />
      </div>
    </div>
  );
}
