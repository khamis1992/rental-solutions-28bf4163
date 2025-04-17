
import React from 'react';
import { useParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { useRentAmount } from '@/hooks/use-rent-amount';

const AgreementDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  // Fetch rent amount using the custom hook - passing the ID as an argument
  const { rentAmount } = useRentAmount(id || '');

  return (
    <PageContainer title="Agreement Detail">
      <div>
        <h2>Agreement ID: {id}</h2>
        <p>Rent Amount: {rentAmount}</p>
      </div>
    </PageContainer>
  );
};

export default AgreementDetailPage;
