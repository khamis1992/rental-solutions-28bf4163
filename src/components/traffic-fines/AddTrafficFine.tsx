
import React from 'react';
import TrafficFineEntry from '@/components/fines/TrafficFineEntry';

interface AddTrafficFineProps {
  onSuccess?: () => void;
}

const AddTrafficFine: React.FC<AddTrafficFineProps> = ({ onSuccess }) => {
  return <TrafficFineEntry onFineSaved={onSuccess} />;
};

export default AddTrafficFine;
