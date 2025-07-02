
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Gavel, 
  AlertTriangle, 
  Clock, 
  User, 
  Calendar,
  ArrowRight
} from 'lucide-react';
import { LegalCase } from '@/types/legal-case';
import { formatDate } from '@/lib/date-utils';
import { Link } from 'react-router-dom';

interface LegalCaseCompactViewProps {
  legalCase: LegalCase;
}

const LegalCaseCompactView: React.FC<LegalCaseCompactViewProps> = ({ legalCase }) => {
  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Active</Badge>;
      case 'pending':
      case 'pending_reminder':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      case 'closed':
      case 'resolved':
      case 'settled':
        return <Badge className="bg-green-500 hover:bg-green-600">Closed</Badge>;
      case 'escalated':
      case 'in_legal_process':
        return <Badge variant="destructive">Escalated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityIcon = (priority: string | null) => {
    if (!priority) return <Clock className="h-4 w-4 text-muted-foreground" />;
    
    switch (priority.toLowerCase()) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'low':
        return <Clock className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getCaseTypeName = (caseType: string) => {
    return caseType
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className={`h-1 w-full ${legalCase.priority === 'high' ? 'bg-red-500' : legalCase.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`}></div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            {getPriorityIcon(legalCase.priority)}
            <h3 className="ml-2 font-medium text-sm">
              {getCaseTypeName(legalCase.case_type)}
            </h3>
          </div>
          {getStatusBadge(legalCase.status)}
        </div>

        <p className="text-sm line-clamp-2 mb-2 text-muted-foreground">
          {legalCase.description || "No description provided"}
        </p>

        <div className="space-y-2 mt-3">
          <div className="flex items-center text-xs text-muted-foreground">
            <User className="h-3 w-3 mr-1" />
            <span>{legalCase.profiles?.full_name || "Unknown Customer"}</span>
          </div>
          
          <div className="flex items-center text-xs text-muted-foreground">
            <Gavel className="h-3 w-3 mr-1" />
            <span>Case #{legalCase.id.substring(0, 8)}</span>
          </div>
          
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            <span>Created: {formatDate(new Date(legalCase.created_at))}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-0 border-t">
        <Button asChild variant="ghost" className="w-full rounded-none h-9">
          <Link to={`/legal/cases/${legalCase.id}`}>
            View Case Details <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LegalCaseCompactView;
