
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatCurrency } from '@/lib/formatters';

interface LegalCaseCardProps {
  agreementId: string;
}

const LegalCaseCard: React.FC<LegalCaseCardProps> = ({ agreementId }) => {
  const navigate = useNavigate();
  const [cases, setCases] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    // Fetch legal cases associated with this agreement
    // This would be replaced with actual API call
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      // Empty array for now - would be replaced with actual data
      setCases([]);
      setIsLoading(false);
    }, 500);
  }, [agreementId]);

  const handleAddCase = () => {
    navigate(`/legal/new?agreement_id=${agreementId}`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Legal Cases</CardTitle>
        <Button variant="outline" size="sm" onClick={handleAddCase}>
          Add Case
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading cases...</div>
        ) : cases.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No legal cases associated with this agreement.
          </div>
        ) : (
          <div className="space-y-4">
            {cases.map((legalCase) => (
              <div
                key={legalCase.id}
                className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/legal/${legalCase.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">Case #{legalCase.id.substring(0, 8)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(legalCase.created_at)}
                    </p>
                  </div>
                  <Badge variant={getCaseStatusVariant(legalCase.status)}>
                    {legalCase.status}
                  </Badge>
                </div>
                <div className="mt-2">
                  <p className="text-sm line-clamp-2">{legalCase.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Amount Owed</p>
                    <p>{formatCurrency(legalCase.amount_owed || 0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Priority</p>
                    <p>{legalCase.priority}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

function getCaseStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'warning';
    case 'resolved':
      return 'success';
    case 'closed':
      return 'secondary';
    case 'pending':
      return 'default';
    default:
      return 'outline';
  }
}

export default LegalCaseCard;
