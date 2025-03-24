
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';

const Bookings = () => {
  return (
    <PageContainer
      title="Bookings Management"
      description="View and manage all car rental bookings"
    >
      <div className="space-y-6">
        <div className="text-center p-12">
          <h2 className="text-2xl font-semibold">Bookings Page</h2>
          <p className="mt-2 text-muted-foreground">
            This page will contain booking management functionality.
          </p>
        </div>
      </div>
    </PageContainer>
  );
};

export default Bookings;
