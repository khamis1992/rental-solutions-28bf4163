import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { trafficFinesApi } from '@/api/trafficFinesApi';
import { mapTrafficFineToComponentFormat } from '@/utils/traffic-fine-mapper';
import { TrafficFine } from '@/types/traffic-fine';

interface CustomerTrafficFinesProps {
  customerId?: string;
}

const CustomerTrafficFines: React.FC<CustomerTrafficFinesProps> = ({ customerId: propCustomerId }) => {
  const { customerId: routeCustomerId } = useParams<{ customerId: string }>();
  const customerId = propCustomerId || routeCustomerId;
  const [trafficFines, setTrafficFines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrafficFines = async () => {
    try {
      setLoading(true);
      const response = await trafficFinesApi.fetchByCustomerId(customerId);
      // Use the mapper to ensure consistent property naming
      const mappedFines = response.map(mapTrafficFineToComponentFormat);
      setTrafficFines(mappedFines);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching traffic fines:", error);
      setError("Failed to load traffic fines");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchTrafficFines();
    }
  }, [customerId]);

  if (loading) {
    return <div>Loading traffic fines...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h3>Traffic Fines for Customer ID: {customerId}</h3>
      {trafficFines.length > 0 ? (
        <ul>
          {trafficFines.map((fine) => (
            <li key={fine.id}>
              {fine.violationNumber} - {fine.licensePlate} - {fine.fineAmount}
            </li>
          ))}
        </ul>
      ) : (
        <p>No traffic fines found for this customer.</p>
      )}
    </div>
  );
};

export default CustomerTrafficFines;
