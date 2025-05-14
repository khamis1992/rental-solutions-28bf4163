
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LegalCaseCompactView from '@/components/legal/LegalCaseCompactView';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useLegalCaseQuery } from '@/hooks/use-legal-case-query';

interface LegalCaseCardProps {
  customerId: string;
  onNewCase?: () => void;
  onViewCase?: (caseId: string) => void;
}

const LegalCaseCard: React.FC<LegalCaseCardProps> = ({
  customerId,
  onNewCase,
  onViewCase
}) => {
  const { getLegalCases, createLegalCase, updateLegalCase } = useLegalCaseQuery(); 
  const { data: legalCases, isLoading } = getLegalCases({ customerId });

  const handleShowDetails = (caseId: string) => {
    if (onViewCase) {
      onViewCase(caseId);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Legal Cases</CardTitle>
        <Button size="sm" onClick={onNewCase}>
          <Plus className="mr-1 h-4 w-4" /> New Case
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center">Loading legal cases...</div>
        ) : legalCases?.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>No legal cases found for this customer</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {legalCases?.map(legalCase => (
              <LegalCaseCompactView 
                key={legalCase.id}
                legalCase={legalCase}
                onShowDetails={handleShowDetails}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LegalCaseCard;
