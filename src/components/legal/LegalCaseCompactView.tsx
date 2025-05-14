
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLegalCases } from '@/hooks/legal/useLegalCases';
import { formatDate } from '@/lib/date-utils';
import { useNavigate } from 'react-router-dom';

interface LegalCaseCompactViewProps {
  customerId?: string;
  agreementId?: string;
}

export function LegalCaseCompactView({ customerId, agreementId }: LegalCaseCompactViewProps) {
  const navigate = useNavigate();
  const { legalCases, isLoading } = useLegalCases({
    customerId,
    agreementId
  });

  const goToNewCase = () => {
    navigate('/legal/cases/new', { 
      state: { customerId, agreementId } 
    });
  };

  const goToCaseDetail = (caseId: string) => {
    navigate(`/legal/cases/${caseId}`);
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-500 hover:bg-red-600';
      case 'medium':
        return 'bg-amber-500 hover:bg-amber-600';
      case 'low':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-slate-500 hover:bg-slate-600';
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Active</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Resolved</Badge>;
      case 'escalated':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Escalated</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Legal Cases</CardTitle>
        <Button onClick={goToNewCase} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New Case
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-4">Loading legal cases...</p>
        ) : legalCases.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No legal cases found</p>
            <Button variant="outline" className="mt-4" onClick={goToNewCase}>
              Create a New Legal Case
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {legalCases.map((legalCase) => (
              <div 
                key={legalCase.id} 
                className="border rounded-md p-4 hover:bg-muted transition-colors cursor-pointer"
                onClick={() => goToCaseDetail(legalCase.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{legalCase.case_type?.replace('_', ' ')}
                      <span className="mx-2">•</span>
                      <Badge className={`${getPriorityColor(legalCase.priority)} text-white`}>
                        {legalCase.priority || 'No Priority'} 
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{legalCase.description || 'No description provided'}</p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(legalCase.status)}
                    <p className="text-xs text-muted-foreground mt-1">
                      Created {formatDate(legalCase.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-3">
                  <div>
                    {legalCase.amount_owed > 0 && (
                      <p className="text-sm font-medium">
                        Amount: <span className="text-amber-600">QAR {legalCase.amount_owed.toLocaleString()}</span>
                      </p>
                    )}
                  </div>
                  <div>
                    {legalCase.assigned_to && (
                      <p className="text-xs text-muted-foreground">
                        Assigned to: {legalCase.assigned_to}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
