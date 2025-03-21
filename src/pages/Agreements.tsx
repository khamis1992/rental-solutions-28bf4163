
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import { AgreementList } from '@/components/agreements/AgreementList';

const Agreements = () => {
  return (
    <PageContainer 
      title="Rental Agreements" 
      description="Manage customer rental agreements and contracts"
    >
      <AgreementList />
    </PageContainer>
  );
};

export default Agreements;
