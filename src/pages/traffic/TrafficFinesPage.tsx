
import React from 'react';
import { useParams } from 'react-router-dom';
import { AgreementTrafficFines } from '@/components/agreements/AgreementTrafficFines';
import PageContainer from '@/components/layout/PageContainer';

const TrafficFinesPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <PageContainer
      title="Traffic Fines"
      description="View traffic violations during the rental period"
      backLink={`/agreements/${id}`}
    >
      <AgreementTrafficFines agreementId={id || ''} startDate={null} endDate={null} />
    </PageContainer>
  );
};

export default TrafficFinesPage;
