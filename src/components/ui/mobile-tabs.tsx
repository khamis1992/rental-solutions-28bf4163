
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MobileTabsProps {
  tabs: {
    id: string;
    label: React.ReactNode;
    content: React.ReactNode;
    icon?: React.ReactNode;
  }[];
  defaultValue?: string;
  className?: string;
  onChange?: (value: string) => void;
}

export function MobileTabs({
  tabs,
  defaultValue,
  className,
  onChange
}: MobileTabsProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue || tabs[0].id);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Visible on mobile */}
      <div className="md:hidden">
        <div className="overflow-x-auto scrollbar-none pb-2">
          <div className="flex space-x-2 min-w-max">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                size="sm"
                variant={activeTab === tab.id ? "default" : "outline"}
                className="flex items-center gap-1"
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </Button>
            ))}
          </div>
        </div>
        
        <div className="mt-4">
          {tabs.map((tab) => (
            activeTab === tab.id && (
              <div key={tab.id} className="animate-fade-in">
                {tab.content}
              </div>
            )
          ))}
        </div>
      </div>
      
      {/* Visible on desktop */}
      <div className="hidden md:block">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
          {tabs.map((tab) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="flex items-center gap-1"
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            {tab.content}
          </TabsContent>
        ))}
      </div>
    </div>
  );
}
