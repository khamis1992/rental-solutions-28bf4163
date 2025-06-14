
// No changes needed to the main component, already handling description correctly
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, Loader2, RefreshCw, AlertTriangle, CheckCircle, Save } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';
import { usePaymentScheduleManagement } from '@/hooks/payment/use-payment-schedule-management';
import { toast } from 'sonner';

interface PaymentScheduleEditorProps {
  agreementId?: string;
  startDate: Date;
  endDate: Date;
  rentAmount: number;
  paymentFrequency: string;
  paymentDay: number;
  onFrequencyChange: (value: string) => void;
  onPaymentDayChange: (value: number) => void;
}

interface PaymentItem {
  dueDate: Date;
  amount: number;
  status: string;
}

const PaymentScheduleEditor = ({
  agreementId,
  startDate,
  endDate,
  rentAmount,
  paymentFrequency,
  paymentDay,
  onFrequencyChange,
  onPaymentDayChange,
}: PaymentScheduleEditorProps) => {
  const [localPaymentSchedule, setLocalPaymentSchedule] = useState<PaymentItem[]>([]);
  const [error, setError] = useState<string>('');
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Use the payment schedule management hook
  const {
    paymentSchedule: persistedSchedule,
    isLoading: isLoadingPersisted,
    isGenerating,
    generatePaymentSchedule,
    isPending
  } = usePaymentScheduleManagement(agreementId);

  // Validate input parameters
  const validateInputs = (): { isValid: boolean; warnings: string[] } => {
    const warnings: string[] = [];
    
    if (!startDate || isNaN(startDate.getTime())) {
      warnings.push('Start date is invalid');
    }
    
    if (!endDate || isNaN(endDate.getTime())) {
      warnings.push('End date is invalid');
    }
    
    if (startDate && endDate && startDate >= endDate) {
      warnings.push('End date must be after start date');
    }
    
    if (!rentAmount || rentAmount <= 0) {
      warnings.push('Rent amount must be greater than 0');
    }
    
    if (!paymentDay || paymentDay < 1 || paymentDay > 31) {
      warnings.push('Payment day must be between 1 and 31');
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  };

  // Generate local payment schedule preview
  const generateLocalPaymentSchedule = (): PaymentItem[] => {
    console.log('🔄 Generating local payment schedule preview');

    const validation = validateInputs();
    setValidationWarnings(validation.warnings);
    
    if (!validation.isValid) {
      console.warn('❌ Invalid inputs for payment schedule:', validation.warnings);
      setError('Please fix the validation errors before generating schedule');
      return [];
    }

    setError('');
    
    try {
      const payments: PaymentItem[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      let currentDate = new Date(start);
      
      if (paymentDay && paymentDay >= 1 && paymentDay <= 31) {
        currentDate.setDate(paymentDay);
        if (currentDate < start) {
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }
      
      // Calculate payment amount based on frequency
      let amount = rentAmount;
      if (paymentFrequency === 'weekly') {
        amount = (rentAmount * 12) / 52;
      } else if (paymentFrequency === 'biweekly') {
        amount = (rentAmount * 12) / 26;
      } else if (paymentFrequency === 'quarterly') {
        amount = rentAmount * 3;
      }
      
      let paymentCount = 0;
      while (currentDate <= end && paymentCount < 100) {
        payments.push({
          dueDate: new Date(currentDate),
          amount: Math.round(amount * 100) / 100,
          status: 'pending'
        });
        
        paymentCount++;
        
        // Advance to next payment date
        if (paymentFrequency === 'weekly') {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (paymentFrequency === 'biweekly') {
          currentDate.setDate(currentDate.getDate() + 14);
        } else if (paymentFrequency === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (paymentFrequency === 'quarterly') {
          currentDate.setMonth(currentDate.getMonth() + 3);
        }
      }
      
      console.log(`✅ Generated ${payments.length} local payments`);
      return payments;
    } catch (error) {
      console.error("❌ Error generating local payment schedule:", error);
      setError(`Failed to generate schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  };

  // Update local schedule when inputs change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (startDate && endDate && rentAmount) {
        const newSchedule = generateLocalPaymentSchedule();
        setLocalPaymentSchedule(newSchedule);
        
        // Check if schedule differs from persisted version
        const differs = !persistedSchedule || 
          persistedSchedule.length !== newSchedule.length ||
          newSchedule.some((item, index) => {
            const persistedItem = persistedSchedule[index];
            return !persistedItem || 
              new Date(persistedItem.due_date).getTime() !== item.dueDate.getTime() ||
              Math.abs(persistedItem.amount - item.amount) > 0.01;
          });
        
        setHasUnsavedChanges(differs);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [startDate, endDate, rentAmount, paymentFrequency, paymentDay, persistedSchedule]);

  // Save schedule to database
  const handleSaveSchedule = async () => {
    if (!agreementId) {
      toast.error('Agreement ID is required to save schedule');
      return;
    }

    await generatePaymentSchedule(
      startDate,
      endDate,
      rentAmount,
      paymentFrequency,
      paymentDay
    );
    
    setHasUnsavedChanges(false);
  };

  const canGenerateSchedule = startDate && endDate && rentAmount > 0;
  const displaySchedule = persistedSchedule.length > 0 ? persistedSchedule : localPaymentSchedule;
  const totalScheduledAmount = displaySchedule.reduce((sum, payment) => {
    return sum + (typeof payment.amount === 'number' ? payment.amount : 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Validation Warnings */}
      {validationWarnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validationWarnings.map((warning, index) => (
                <div key={index}>• {warning}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && agreementId && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes to the payment schedule. Save to persist changes to the database.
          </AlertDescription>
        </Alert>
      )}

      {/* Input Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Label htmlFor="paymentFrequency">Payment Frequency</Label>
          <Select 
            value={paymentFrequency} 
            onValueChange={onFrequencyChange}
          >
            <SelectTrigger id="paymentFrequency">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Bi-weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="paymentDay">Payment Day of Month (1-31)</Label>
          <Input 
            id="paymentDay"
            type="number" 
            min={1} 
            max={31} 
            value={paymentDay} 
            onChange={(e) => onPaymentDayChange(parseInt(e.target.value) || 1)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {paymentFrequency === 'monthly' || paymentFrequency === 'quarterly' 
              ? "Day of the month when payment is due" 
              : "Will be used for the first payment date"}
          </p>
        </div>
        
        <div className="flex items-end gap-2">
          {agreementId && hasUnsavedChanges && (
            <Button 
              onClick={handleSaveSchedule}
              disabled={isGenerating || !canGenerateSchedule}
              className="flex-1"
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Schedule
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => {
              const newSchedule = generateLocalPaymentSchedule();
              setLocalPaymentSchedule(newSchedule);
            }}
            disabled={isGenerating || !canGenerateSchedule}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Schedule Status */}
      {displaySchedule.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            {persistedSchedule.length > 0 ? 'Saved' : 'Preview'}: {displaySchedule.length} payments totaling {formatCurrency(totalScheduledAmount)}
            {persistedSchedule.length > 0 && (
              <span className="block text-green-600 text-sm mt-1">
                This schedule is saved to the database and will appear in Payment History
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Payment Schedule Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Payment Schedule {persistedSchedule.length > 0 ? '(Saved)' : '(Preview)'}</span>
            <span className="text-sm text-muted-foreground">
              {displaySchedule.length} payments
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!canGenerateSchedule ? (
            <div className="py-8 text-center text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
              <p>Please fill in start date, end date, and rent amount to generate payment schedule</p>
            </div>
          ) : displaySchedule.length > 0 ? (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displaySchedule.map((payment, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          {formatDate(
                            'due_date' in payment 
                              ? new Date(payment.due_date) 
                              : payment.dueDate
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <span className="capitalize">
                          {payment.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {isGenerating || isLoadingPersisted ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p>Loading payment schedule...</p>
                </div>
              ) : (
                <p>No payment schedule generated yet</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentScheduleEditor;
