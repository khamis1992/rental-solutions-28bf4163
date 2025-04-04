
import React from 'react';
import { useParams } from 'react-router-dom';

const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Customer Details</h1>
      <p className="text-muted-foreground mt-2">
        Viewing details for customer ID: {id}
      </p>
    </div>
  );
};

export default CustomerDetails;
