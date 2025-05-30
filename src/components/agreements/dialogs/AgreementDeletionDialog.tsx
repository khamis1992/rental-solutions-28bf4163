
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, FileText, CreditCard, AlertCircle, Scale, Car } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { agreementDeletionService, DeletionValidationResult } from '@/services/AgreementDeletionService';
import { toast } from 'sonner';

interface AgreementDeletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId: string;
  agreementNumber: string;
  onConfirmDelete: () => Promise<void>;
}

export function AgreementDeletionDialog({
  open,
  onOpenChange,
  agreementId,
  agreementNumber,
  onConfirmDelete
}: AgreementDeletionDialogProps) {
  const [validation, setValidation] = useState<DeletionValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load validation data when dialog opens
  useEffect(() => {
    if (open && agreementId) {
      loadValidationData();
    }
  }, [open, agreementId]);

  const loadValidationData = async () => {
    setIsLoading(true);
    try {
      const result = await agreementDeletionService.validateDeletion(agreementId);
      if (result.success) {
        setValidation(result.data);
      } else {
        toast.error('Failed to validate deletion requirements');
      }
    } catch (error) {
      console.error('Error validating deletion:', error);
      toast.error('Failed to check deletion requirements');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirmDelete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting agreement:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const DependencyIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'payments': return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'trafficFines': return <AlertCircle className="h-4 w-4 text-amber-600" />;
      case 'legalCases': return <Scale className="h-4 w-4 text-red-600" />;
      case 'documents': return <FileText className="h-4 w-4 text-blue-600" />;
      default: return <Car className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDependencyLabel = (type: string, count: number) => {
    const labels = {
      payments: count === 1 ? 'Payment Record' : 'Payment Records',
      paymentSchedules: count === 1 ? 'Payment Schedule' : 'Payment Schedules',
      trafficFines: count === 1 ? 'Traffic Fine' : 'Traffic Fines',
      legalCases: count === 1 ? 'Legal Case' : 'Legal Cases',
      documents: count === 1 ? 'Document' : 'Documents'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Agreement
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete agreement <strong>{agreementNumber}</strong>? 
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : validation ? (
            <>
              {validation.totalDependencies > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This agreement has {validation.totalDependencies} related record(s) that will also be deleted.
                  </AlertDescription>
                </Alert>
              )}

              {/* Show dependency breakdown */}
              {validation.totalDependencies > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Records to be deleted:</h4>
                  <div className="space-y-2">
                    {Object.entries(validation.dependentRecords).map(([type, count]) => {
                      if (count === 0) return null;
                      return (
                        <div key={type} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <DependencyIcon type={type} />
                            <span>{getDependencyLabel(type, count)}</span>
                          </div>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Show warnings */}
              {validation.warnings.length > 0 && (
                <div className="space-y-2">
                  <Separator />
                  <div className="space-y-1">
                    {validation.warnings.map((warning, index) => (
                      <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <AlertCircle className="h-3 w-3 mt-0.5 text-amber-500 flex-shrink-0" />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {validation.totalDependencies === 0 && (
                <Alert>
                  <AlertDescription>
                    This agreement has no related records and can be safely deleted.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <Alert variant="destructive">
              <AlertDescription>
                Unable to validate deletion requirements. Please try again.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <LoadingButton
            variant="destructive"
            onClick={handleConfirmDelete}
            isLoading={isDeleting}
            disabled={isLoading || !validation}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Deleting...' : 'Delete Agreement'}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
