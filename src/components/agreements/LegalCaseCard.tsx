
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, FileText, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { hasData } from '@/utils/database-type-helpers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export interface LegalCaseCardProps {
  agreementId: string;
}

// Export default instead of named export
export default function LegalCaseCard({ agreementId }: LegalCaseCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [legalCase, setLegalCase] = useState<any>(null);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [isResolutionDialogOpen, setIsResolutionDialogOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLegalCase();
  }, [agreementId]);

  const fetchLegalCase = async () => {
    try {
      setIsLoading(true);
      
      // First get the customer ID from the agreement
      const { data: agreementData, error: agreementError } = await supabase
        .from('leases')
        .select('customer_id')
        .eq('id', agreementId)
        .single();
        
      if (agreementError) {
        console.error("Error fetching agreement:", agreementError);
        return;
      }
      
      if (!agreementData?.customer_id) {
        console.error("No customer ID found for agreement");
        return;
      }
      
      // Get customer info
      const { data: customerData, error: customerError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone_number')
        .eq('id', agreementData.customer_id)
        .single();
        
      if (!customerError && customerData) {
        setCustomerInfo(customerData);
      }
      
      // Get legal case for this customer
      const { data: caseData, error: caseError } = await supabase
        .from('legal_cases')
        .select('*')
        .eq('customer_id', agreementData.customer_id)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (caseError) {
        console.error("Error fetching legal case:", caseError);
        return;
      }
      
      if (caseData && caseData.length > 0) {
        setLegalCase(caseData[0]);
      }
    } catch (error) {
      console.error("Error in fetchLegalCase:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveCase = async () => {
    if (!legalCase) return;
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('legal_cases')
        .update({
          status: 'resolved',
          resolution_notes: resolutionNotes,
          resolution_date: new Date().toISOString()
        })
        .eq('id', legalCase.id);
        
      if (error) {
        console.error("Error resolving case:", error);
        toast.error("Failed to resolve legal case");
        return;
      }
      
      toast.success("Legal case resolved successfully");
      setIsResolutionDialogOpen(false);
      fetchLegalCase();
    } catch (error) {
      console.error("Error in handleResolveCase:", error);
      toast.error("An error occurred while resolving the case");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-red-500">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500">Resolved</Badge>;
      case 'escalated':
        return <Badge className="bg-purple-500">Escalated</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-500">High Priority</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium Priority</Badge>;
      case 'low':
        return <Badge className="bg-blue-500">Low Priority</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Legal Case Information</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!legalCase) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Legal Case Information</CardTitle>
          <CardDescription>No legal cases found for this agreement</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <div className="flex flex-col items-center justify-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No legal cases have been filed for this customer.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Legal Case Information</CardTitle>
            <CardDescription>Details about the legal case for this agreement</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(legalCase.status)}
            {legalCase.priority && getPriorityBadge(legalCase.priority)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Case Type</h3>
              <p>{legalCase.case_type || 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Amount Owed</h3>
              <p className="font-semibold text-red-600">
                {legalCase.amount_owed ? `QAR ${legalCase.amount_owed.toLocaleString()}` : 'N/A'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Created Date</h3>
              <p>{legalCase.created_at ? format(new Date(legalCase.created_at), 'PPP') : 'N/A'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Assigned To</h3>
              <p>{legalCase.assigned_to || 'Unassigned'}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
            <p className="text-sm whitespace-pre-line">{legalCase.description || 'No description provided'}</p>
          </div>
          
          {legalCase.status === 'resolved' && (
            <div className="bg-green-50 p-3 rounded-md border border-green-200">
              <div className="flex items-center mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                <h3 className="text-sm font-medium text-green-800">Case Resolved</h3>
              </div>
              <p className="text-sm text-green-700 whitespace-pre-line">{legalCase.resolution_notes || 'No resolution notes provided'}</p>
              {legalCase.resolution_date && (
                <p className="text-xs text-green-600 mt-2">
                  Resolved on {format(new Date(legalCase.resolution_date), 'PPP')}
                </p>
              )}
            </div>
          )}
          
          {legalCase.status !== 'resolved' && (
            <div className="flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => setIsResolutionDialogOpen(true)}
              >
                Mark as Resolved
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      
      <Dialog open={isResolutionDialogOpen} onOpenChange={setIsResolutionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Legal Case</DialogTitle>
            <DialogDescription>
              Enter resolution details to close this legal case.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Resolution Notes</h4>
              <Textarea
                placeholder="Enter details about how this case was resolved..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsResolutionDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleResolveCase}
              disabled={isSubmitting || !resolutionNotes.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resolving...
                </>
              ) : (
                'Resolve Case'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
