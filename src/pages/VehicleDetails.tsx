
import React from 'react';
import { useParams } from 'react-router-dom';

const VehicleDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Vehicle Details</h1>
      <p className="text-muted-foreground mt-2">
        Viewing details for vehicle ID: {id}
      </p>
    </div>
  );
};

export default VehicleDetails;
