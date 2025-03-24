
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, FileText, UserCog, CalendarClock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';
import { CustomerObligation } from './CustomerLegalObligations';

interface LegalCaseDetailsProps {
  obligation: CustomerObligation | null;
  onClose: () => void;
}

const LegalCaseDetails: React.FC<LegalCaseDetailsProps> = ({ obligation, onClose }) => {
  if (!obligation) {
    return null;
  }

  const getUrgencyColorClass = (urgency?: string) => {
    if (!urgency) return '';
    
    switch (urgency) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return '';
    }
  };

  const isRecentDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 30;
  };
  
  const formatDate = (date: Date | string) => {
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    return new Date(date).toLocaleDateString();
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{obligation.description}</CardTitle>
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
              {obligation.customerId ? (
                <Link 
                  to={`/customers/${obligation.customerId}`} 
                  className="text-primary hover:underline flex items-center"
                >
                  {obligation.customerName || 'Unknown Customer'}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
              ) : (
                <span>Unknown Customer</span>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Amount Due</h4>
            <p className="font-medium">{formatCurrency(obligation.amount)}</p>
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
              <span className={isRecentDate(obligation.dueDate) ? 'text-red-500 font-medium' : ''}>
                {formatDate(obligation.dueDate)}
              </span>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Urgency</h4>
            <p className={`font-medium ${getUrgencyColorClass(obligation.urgency)}`}>
              {obligation.urgency ? (obligation.urgency.charAt(0).toUpperCase() + obligation.urgency.slice(1)) : 'Medium'}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Status</h4>
            <Badge variant={
              typeof obligation.status === 'string' && 
              obligation.status.toLowerCase().includes('overdue') ? 'destructive' : 'outline'
            }>
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
