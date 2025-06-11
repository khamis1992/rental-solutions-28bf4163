import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface AddAgreementFormProps {
  onAgreementCreated: () => void;
}

const AddAgreementForm = ({ onAgreementCreated }: AddAgreementFormProps) => {
  const [agreementNumber, setAgreementNumber] = useState('');
  const navigate = useNavigate();

  const handleCreateAgreement = () => {
    // Here you would typically make an API call to create the agreement
    // and handle the response. For this example, we'll just navigate to
    // the edit agreement page with a new agreement ID.
    const newAgreementId = 'new-agreement-' + Date.now(); // Placeholder ID
    console.log('Creating agreement with ID:', newAgreementId);
    onAgreementCreated();
    navigate(`/agreements/${newAgreementId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Agreement</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="space-y-2">
            <label htmlFor="agreementNumber">Agreement Number</label>
            <input
              type="text"
              id="agreementNumber"
              placeholder="Auto-generated"
              value={agreementNumber}
              onChange={(e) => setAgreementNumber(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>
          <Button onClick={handleCreateAgreement}>Create Agreement</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AddAgreementForm;
