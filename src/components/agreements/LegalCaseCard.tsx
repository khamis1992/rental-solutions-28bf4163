
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export interface LegalCaseCardProps {
  agreementId: string;
}

export default function LegalCaseCard({ agreementId }: LegalCaseCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [legalCase, setLegalCase] = useState(null as any);
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
        console.log("No customer found for agreement");
        return;
      }

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
      console.error('Error fetching legal case:', error);
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!legalCase) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Legal Case
        </CardTitle>
        <CardDescription>Case #{legalCase.case_number}</CardDescription>
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
