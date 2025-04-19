
import React from 'react';
import { useParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { AgreementTrafficFines } from '@/components/agreements/AgreementTrafficFines';

const TrafficFinesPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <PageContainer
      title="Traffic Fines"
      description="View traffic fines associated with this agreement"
      backLink={`/agreements/${id}`}
    >
      <AgreementTrafficFines agreementId={id || ''} />
    </PageContainer>
  );
};

export default TrafficFinesPage;
