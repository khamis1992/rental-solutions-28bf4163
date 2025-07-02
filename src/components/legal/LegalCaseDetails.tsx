
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, FileText, UserCog, CalendarClock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
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

  const isRecentDate = (date?: Date) => {
    if (!date) return false;
    
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 30;
  };

  return (
    <Card className="border-l-4 border-l-primary shadow-md animate-fade-in">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{obligation.description}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <span className="sr-only">Close</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>
            </svg>
          </Button>
        </div>
        <CardDescription>
          Case ID: {obligation.id.substring(0, 8)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Customer</h4>
            <div className="flex items-center">
              <UserCog className="mr-2 h-4 w-4 text-muted-foreground" />
              {obligation.customerId ? (
                <Link 
                  to={`/customers/${obligation.customerId}`} 
                  className="text-primary hover:underline flex items-center"
                >
                  {obligation.customerName || 'Customer'}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Link>
              ) : (
                <span>Not assigned</span>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Amount Due</h4>
            <p className="font-medium">{obligation.amount ? formatCurrency(obligation.amount) : 'N/A'}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Due Date</h4>
            <div className="flex items-center">
              <CalendarClock className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className={isRecentDate(obligation.dueDate) ? 'text-red-500 font-medium' : ''}>
                {obligation.dueDate ? formatDate(obligation.dueDate) : 'No due date set'}
              </span>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Urgency</h4>
            <p className={`font-medium ${getUrgencyColorClass(obligation.urgency)}`}>
              {obligation.urgency ? obligation.urgency.charAt(0).toUpperCase() + obligation.urgency.slice(1) : 'Not specified'}
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
            <p className={`font-medium ${(obligation.daysOverdue || 0) > 0 ? 'text-red-500' : ''}`}>
              {obligation.daysOverdue ?? 0}
            </p>
            {(obligation.daysOverdue || 0) > 0 && obligation.obligationType === 'payment' && (
              <p className="text-xs text-red-500">
                Late fee: {formatCurrency(120)} / day
              </p>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="border-t pt-4 mt-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="default">
              <FileText className="mr-2 h-4 w-4" />
              Generate Document
            </Button>
            <Button variant="outline">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Send Reminder
            </Button>
            <Button variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><path d="m9 11 3 3L22 4"></path>
              </svg>
              Mark As Resolved
            </Button>
          </div>
        </div>
        
        {/* Related Information */}
        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-medium mb-2">Related Information</h4>
          <div className="space-y-2">
            {obligation.obligationType === 'payment' && obligation.customerId && (
              <Button 
                variant="outline" 
                size="sm" 
                asChild 
                className="mr-2"
              >
                <Link to={`/customers/${obligation.customerId}`}>
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
