
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MobileTabs } from '@/components/ui/mobile-tabs';
import { FileText, CreditCard, Gavel, AlertTriangle } from 'lucide-react';
import { Agreement } from '@/lib/validation-schemas/agreement';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface AgreementTabsProps {
  agreement: Agreement;
  children: React.ReactNode;
}

export function AgreementTabs({
  agreement,
  children
}: AgreementTabsProps) {
  const navigate = useNavigate();
  
  const handlePaymentsClick = () => {
    navigate(`/agreements/${agreement.id}/payments`);
  };
  
  const handleFinesClick = () => {
    navigate(`/agreements/${agreement.id}/fines`);
  };
  
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
        <div className="flex flex-col items-center justify-center py-8">
          <Button onClick={handlePaymentsClick} variant="outline">
            View Payment History
          </Button>
        </div>
      )
    },
    {
      id: "fines",
      label: "Traffic Fines",
      icon: <AlertTriangle className="h-4 w-4" />,
      content: (
        <div className="flex flex-col items-center justify-center py-8">
          <Button onClick={handleFinesClick} variant="outline">
            View Traffic Fines
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="w-full mt-6">
      {/* Desktop view - uses standard Tabs */}
      <div className="hidden md:block">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="animate-fade-in">
              {tab.content}
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
