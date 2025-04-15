
import React from 'react';
import { CustomerObligation } from './CustomerLegalObligations.types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { UserCog, FileText, ExternalLink, CalendarClock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface LegalCaseDetailsProps {
  obligation: CustomerObligation | null;
  onClose: () => void;
}

const LegalCaseDetails: React.FC<LegalCaseDetailsProps> = ({ obligation, onClose }) => {
  if (!obligation) {
    return null;
  }

  const getUrgencyColorClass = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return '';
    }
  };

  const isRecentDate = (date: Date) => {
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 30;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return format(date, 'MMM d, yyyy');
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{obligation.title}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>
        <CardDescription>
          Case ID: {obligation.id.substring(0, 8)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Customer</h4>
            <div className="flex items-center">
              <UserCog className="mr-2 h-4 w-4 text-muted-foreground" />
              <Link 
                to={`/customers/${obligation.customerId}`} 
                className="text-primary hover:underline flex items-center"
              >
                {obligation.customerId}
                <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Amount Due</h4>
            <p className="font-medium">{formatCurrency(obligation.amount || 0)}</p>
            {obligation.lateFine && obligation.lateFine > 0 && obligation.obligationType === 'payment' && (
              <p className="text-xs text-red-500">
                Includes late fine: {formatCurrency(obligation.lateFine)}
              </p>
            )}
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Due Date</h4>
            <div className="flex items-center">
              <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className={obligation.dueDate && isRecentDate(obligation.dueDate) ? 'text-red-500 font-medium' : ''}>
                {formatDate(obligation.dueDate)}
              </span>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Urgency</h4>
            <p className={`font-medium ${getUrgencyColorClass(obligation.urgency)}`}>
              {obligation.urgency.charAt(0).toUpperCase() + obligation.urgency.slice(1)}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
            <Badge variant={obligation.status.toLowerCase().includes('overdue') ? 'destructive' : 'outline'}>
              {obligation.status}
            </Badge>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Days Overdue</h4>
            <p className={`font-medium ${obligation.daysOverdue && obligation.daysOverdue > 0 ? 'text-red-500' : ''}`}>
              {obligation.daysOverdue || 0}
            </p>
            {obligation.daysOverdue && obligation.daysOverdue > 0 && obligation.obligationType === 'payment' && (
              <p className="text-xs text-red-500">
                Late fee: {formatCurrency(120)} / day (max {formatCurrency(3000)})
              </p>
            )}
          </div>
        </div>
        
        {/* Integration links */}
        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-medium mb-2">Related Information</h4>
          <div className="space-y-2">
            {obligation.obligationType === 'payment' && obligation.agreementId && (
              <Button 
                variant="outline" 
                size="sm" 
                asChild 
                className="mr-2"
              >
                <Link to={`/agreements/${obligation.agreementId}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Agreement
                </Link>
              </Button>
            )}
            
            {obligation.customerId && (
              <Button 
                variant="outline" 
                size="sm"
                asChild
              >
                <Link to={`/customers/${obligation.customerId}`}>
                  <UserCog className="mr-2 h-4 w-4" />
                  View Customer Profile
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LegalCaseDetails;
