
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react';

interface AgreementDeletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId: string;
  agreementNumber: string;
  onConfirmDelete: () => Promise<void>;
}

interface DeletionWarningProps {
  type: 'payments' | 'fines' | 'legal' | 'final';
  count?: number;
}

function DeletionWarning({ type, count = 0 }: DeletionWarningProps) {
  const warnings = {
    payments: {
      title: "Payment Records",
      description: `This agreement has ${count} associated payment records that will be permanently deleted.`,
      icon: "💰"
    },
    fines: {
      title: "Traffic Fines",
      description: `This agreement has ${count} associated traffic fines that will be permanently deleted.`,
      icon: "🚨"
    },
    legal: {
      title: "Legal Cases",
      description: `This agreement has ${count} associated legal cases that will be permanently deleted.`,
      icon: "⚖️"
    },
    final: {
      title: "Final Warning",
      description: "This action cannot be undone. All data associated with this agreement will be permanently deleted from the system.",
      icon: "⚠️"
    }
  };

  const warning = warnings[type];

  return (
    <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
      <span className="text-lg">{warning.icon}</span>
      <div className="flex-1">
        <h4 className="font-medium text-red-800">{warning.title}</h4>
        <p className="text-sm text-red-700 mt-1">{warning.description}</p>
      </div>
    </div>
  );
}

export function AgreementDeletionDialog({
  open,
  onOpenChange,
  agreementNumber,
  onConfirmDelete
}: AgreementDeletionDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [step, setStep] = useState<'warning' | 'confirmation'>('warning');

  // Mock data - in real implementation, fetch these counts
  const associatedData = {
    payments: 5,
    fines: 2,
    legal: 1
  };

  const resetDialog = () => {
    setConfirmationText('');
    setIsDeleting(false);
    setStep('warning');
  };

  const handleClose = () => {
    if (!isDeleting) {
      resetDialog();
      onOpenChange(false);
    }
  };

  const handleProceedToConfirmation = () => {
    setStep('confirmation');
  };

  const handleConfirmDelete = async () => {
    if (confirmationText !== agreementNumber) {
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirmDelete();
      resetDialog();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete agreement:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const isConfirmationValid = confirmationText === agreementNumber;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Delete Agreement
          </DialogTitle>
        </DialogHeader>

        {step === 'warning' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You are about to delete agreement <strong>{agreementNumber}</strong>. 
                This will remove all associated data from the system.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">What will be deleted:</h3>
              
              {associatedData.payments > 0 && (
                <DeletionWarning type="payments" count={associatedData.payments} />
              )}
              
              {associatedData.fines > 0 && (
                <DeletionWarning type="fines" count={associatedData.fines} />
              )}
              
              {associatedData.legal > 0 && (
                <DeletionWarning type="legal" count={associatedData.legal} />
              )}

              <DeletionWarning type="final" />
            </div>
          </div>
        )}

        {step === 'confirmation' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action is irreversible. All data will be permanently deleted.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="confirmation">
                Type <code className="px-1 py-0.5 bg-gray-100 rounded text-sm font-mono">{agreementNumber}</code> to confirm deletion:
              </Label>
              <Input
                id="confirmation"
                type="text"
                placeholder={`Type "${agreementNumber}" here`}
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                className={confirmationText && !isConfirmationValid ? 'border-red-300' : ''}
                disabled={isDeleting}
              />
              {confirmationText && !isConfirmationValid && (
                <p className="text-sm text-red-600">
                  Please type the exact agreement number to confirm.
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={step === 'warning' ? handleClose : () => setStep('warning')}
            disabled={isDeleting}
          >
            {step === 'warning' ? 'Cancel' : 'Back'}
          </Button>
          
          {step === 'warning' ? (
            <Button
              variant="destructive"
              onClick={handleProceedToConfirmation}
              disabled={isDeleting}
            >
              Continue to Confirmation
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={!isConfirmationValid || isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? 'Deleting...' : 'Delete Agreement'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
