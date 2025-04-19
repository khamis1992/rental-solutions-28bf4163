
import React from 'react';
import { useParams } from 'react-router-dom';
import LegalCaseCard from '@/components/agreements/LegalCaseCard';
import PageContainer from '@/components/layout/PageContainer';

const LegalCasesPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <PageContainer
      title="Legal Cases"
      description="View legal cases associated with this agreement"
      backLink={`/agreements/${id}`}
    >
      <LegalCaseCard agreementId={id || ''} />
    </PageContainer>
  );
};

export default LegalCasesPage;
