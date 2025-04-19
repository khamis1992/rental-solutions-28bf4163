
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MobileTabs } from '@/components/ui/mobile-tabs';
import { FileText, AlertTriangle } from 'lucide-react';
import { Agreement } from '@/lib/validation-schemas/agreement';

interface AgreementTabsProps {
  agreement: Agreement;
  children: React.ReactNode;
}

export function AgreementTabs({
  agreement,
  children,
}: AgreementTabsProps) {
  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: <FileText className="h-4 w-4" />,
      content: children
    },
    {
      id: "fines",
      label: "Traffic Fines",
      icon: <AlertTriangle className="h-4 w-4" />,
      content: (
        <div className="mt-4">
          {React.Children.map(children, child => {
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
          <TabsList className="grid grid-cols-2 mb-6">
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
