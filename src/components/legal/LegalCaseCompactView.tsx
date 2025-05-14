
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';
import { LegalCase } from '@/hooks/legal/types';

interface LegalCaseCompactViewProps {
  legalCase: LegalCase;
  onShowDetails: (caseId: string) => void;
}

const getLegalCaseStatusBadge = (status: string) => {
  switch (status) {
    case 'resolved':
      return <Badge className="bg-green-500">Resolved</Badge>;
    case 'in_progress':
      return <Badge className="bg-blue-500">In Progress</Badge>;
    case 'pending_reminder':
      return <Badge className="bg-amber-500">Reminder Pending</Badge>;
    case 'escalated':
      return <Badge className="bg-red-500">Escalated</Badge>;
    default:
      return <Badge className="bg-gray-500">{status}</Badge>;
  }
};

const LegalCaseCompactView: React.FC<LegalCaseCompactViewProps> = ({ 
  legalCase, 
  onShowDetails 
}) => {
  return (
    <Card className="h-full flex flex-col">
      <CardContent className="pt-6 flex-1">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-semibold">
              {legalCase.case_type || 'Legal Case'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Opened {legalCase.created_at ? formatDate(legalCase.created_at) : 'N/A'}
            </p>
          </div>
          {getLegalCaseStatusBadge(legalCase.status)}
        </div>
        
        <div className="mt-4">
          {legalCase.description && (
            <p className="text-sm line-clamp-3">{legalCase.description}</p>
          )}
        </div>
        
        <div className="mt-4 space-y-1">
          {legalCase.amount_owed > 0 && (
            <p className="text-sm">
              <span className="font-medium">Amount owed:</span> QAR {legalCase.amount_owed.toLocaleString()}
            </p>
          )}
          
          {legalCase.reminder_count > 0 && (
            <p className="text-sm">
              <span className="font-medium">Reminders sent:</span> {legalCase.reminder_count}
            </p>
          )}
          
          {legalCase.escalation_date && (
            <p className="text-sm">
              <span className="font-medium">Escalation date:</span> {formatDate(legalCase.escalation_date)}
            </p>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-4">
        <Button 
          variant="secondary" 
          size="sm" 
          className="w-full"
          onClick={() => onShowDetails(legalCase.id)}
        >
          View Case Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LegalCaseCompactView;
