
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import { AgreementList } from '@/components/agreements/AgreementList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { DoubleBookingAuditButton } from '@/components/agreements/DoubleBookingAuditButton';
import { DoubleBookingResults } from '@/components/agreements/DoubleBookingResults';

export default function Agreements() {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    setShowResults(true);
  };

  return (
    <PageContainer
      title="Rental Agreements"
      description="Manage customer rental agreements and contracts"
      actions={
        <div className="flex space-x-2">
          <DoubleBookingAuditButton onCheckComplete={handleRefresh} />
          <Button onClick={() => navigate('/agreements/add')}>
            <Plus className="mr-2 h-4 w-4" />
            New Agreement
          </Button>
        </div>
      }
    >
      {showResults && <div className="mb-6"><DoubleBookingResults /></div>}
      <AgreementList refreshTrigger={refreshTrigger} />
    </PageContainer>
  );
}
