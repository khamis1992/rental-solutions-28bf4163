
import React, { Suspense } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { AgreementList } from '@/components/agreements/AgreementList';
import { Loader2 } from 'lucide-react';

const Agreements = () => {
  return (
    <PageContainer 
      title="Rental Agreements" 
      description="Manage customer rental agreements and contracts"
    >
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading agreements...</span>
        </div>
      }>
        <AgreementList />
      </Suspense>
    </PageContainer>
  );
};

export default Agreements;
