
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileDown, FileText, AlertTriangle, RefreshCw, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import { fetchLegalObligations } from './LegalObligationsService';

interface LegalObligationsTabProps {
  customerId: string;
}

// Define the CustomerObligation type to match what is returned by fetchLegalObligations
export interface CustomerObligation {
  id: string;
  customerId: string;
  customerName: string;
  obligationType: 'payment' | 'traffic_fine' | 'legal_case';
  amount: number;
  dueDate: Date;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  daysOverdue: number;
  agreementId?: string;
  agreementNumber?: string;
  lateFine?: number;
}

const LegalObligationsTab: React.FC<LegalObligationsTabProps> = ({ customerId }) => {
  const [obligations, setObligations] = useState<CustomerObligation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadObligations = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchLegalObligations();
        if (result.error) {
          setError(result.error);
          toast.error('Error loading legal obligations');
        } else {
          const customerObligations = result.obligations.filter(
            obligation => obligation.customerId === customerId
          );
          setObligations(customerObligations);
        }
      } catch (err) {
        setError('Failed to load obligations');
        toast.error('Failed to load obligations');
      } finally {
        setLoading(false);
      }
    };

    loadObligations();
  }, [customerId]);

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Medium</Badge>;
      case 'low':
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  const handleProcessPayment = (obligation: CustomerObligation) => {
    toast.info(`Processing payment for ${obligation.description}...`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading legal obligations...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-md border border-red-200">
        <h3 className="font-medium">Error loading legal obligations</h3>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  if (obligations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            No legal obligations found for this customer.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Legal Obligations</CardTitle>
        <CardDescription>
          Pending legal matters that require attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {obligations.map((obligation) => (
            <div 
              key={obligation.id} 
              className={`p-4 rounded-md border ${
                obligation.urgency === 'critical' ? 'border-l-4 border-l-red-500' :
                obligation.urgency === 'high' ? 'border-l-4 border-l-orange-500' :
                obligation.urgency === 'medium' ? 'border-l-4 border-l-yellow-500' :
                'border-l-4 border-l-gray-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center">
                    {obligation.obligationType === 'payment' && (
                      <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
                    )}
                    {obligation.obligationType === 'traffic_fine' && (
                      <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                    )}
                    {obligation.obligationType === 'legal_case' && (
                      <FileText className="mr-2 h-4 w-4 text-blue-500" />
                    )}
                    <h4 className="font-medium">{obligation.description}</h4>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Amount Due:</span> {formatCurrency(obligation.amount)}
                      {obligation.lateFine > 0 && obligation.obligationType === 'payment' && (
                        <span className="text-xs text-red-500 block">
                          Includes late fine: {formatCurrency(obligation.lateFine)}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Due Date:</span> {formatDate(obligation.dueDate)}
                    </div>
                    <div>
                      <span className="font-medium">Days Overdue:</span> {obligation.daysOverdue}
                      {obligation.daysOverdue > 0 && obligation.obligationType === 'payment' && (
                        <span className="text-xs text-red-500 block">
                          Late fee: {formatCurrency(120)}/day (max {formatCurrency(3000)})
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">Urgency:</span> {getUrgencyBadge(obligation.urgency)}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {obligation.agreementId && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/agreements/${obligation.agreementId}`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Agreement
                      </Link>
                    </Button>
                  )}
                  
                  {obligation.obligationType === 'payment' && (
                    <Button variant="default" size="sm" onClick={() => handleProcessPayment(obligation)}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Process Payment
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default LegalObligationsTab;
