
import React from 'react';
import { 
  Tabs, TabsList, TabsTrigger 
} from '@/components/ui/tabs';
import { AgreementViewSelectors } from '@/components/agreements/AgreementViewSelectors';

interface AgreementHeaderProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  viewMode: 'card' | 'table' | 'compact';
  setViewMode: (mode: 'card' | 'table' | 'compact') => void;
}

export const AgreementHeader: React.FC<AgreementHeaderProps> = ({
  activeTab,
  onTabChange,
  viewMode,
  setViewMode
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <Tabs 
        defaultValue={activeTab} 
        value={activeTab} 
        onValueChange={onTabChange}
        className="w-full sm:w-auto"
      >
        <TabsList>
          <TabsTrigger value="agreements">All Agreements</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* View Mode Selector */}
      <div className="flex items-center gap-2">
        <AgreementViewSelectors viewMode={viewMode} setViewMode={setViewMode} />
      </div>
    </div>
  );
};
