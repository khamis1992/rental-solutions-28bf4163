
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { Gavel } from 'lucide-react';
import NewLegalCase from '@/components/legal/NewLegalCase';

const NewLegalCasePage = () => {
  return (
    <PageContainer 
      title="New Legal Case" 
      description="Create a new legal case" 
      backLink="/legal"
    >
      <SectionHeader 
        title="Create New Case" 
        description="Fill in the details to open a new legal case" 
        icon={Gavel} 
      />
      
      <div className="mt-6">
        <NewLegalCase />
      </div>
    </PageContainer>
  );
};

export default NewLegalCasePage;
