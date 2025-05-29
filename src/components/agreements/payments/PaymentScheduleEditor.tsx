
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
import { CalendarIcon, Loader2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import { formatCurrency } from '@/lib/utils';

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
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentItem[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

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

  // Generate payment schedule based on inputs
  const generatePaymentSchedule = (): PaymentItem[] => {
    console.log('🔄 Generating payment schedule with params:', {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      rentAmount,
      paymentFrequency,
      paymentDay,
      agreementId
    });

    // Validate inputs
    const validation = validateInputs();
    setValidationWarnings(validation.warnings);
    
    if (!validation.isValid) {
      console.warn('❌ Invalid inputs for payment schedule:', validation.warnings);
      setError('Please fix the validation errors before generating schedule');
      return [];
    }

    setIsGenerating(true);
    setError('');
    
    try {
      const payments: PaymentItem[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      let currentDate = new Date(start);
      
      // Set day of month if specified (this is the payment day)
      if (paymentDay && paymentDay >= 1 && paymentDay <= 31) {
        currentDate.setDate(paymentDay);
        // If the payment day is before the start date, move to next month
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
      
      console.log(`💰 Calculated payment amount: ${amount} (frequency: ${paymentFrequency})`);
      
      // Generate schedule
      let paymentCount = 0;
      while (currentDate <= end && paymentCount < 100) { // Safety limit
        payments.push({
          dueDate: new Date(currentDate),
          amount: Math.round(amount * 100) / 100,
          status: 'pending'
        });
        
        paymentCount++;
        
        // Advance to next payment date based on frequency
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
      
      console.log(`✅ Generated ${payments.length} payments for agreement`);
      setPaymentSchedule(payments);
      return payments;
    } catch (error) {
      console.error("❌ Error generating payment schedule:", error);
      setError(`Failed to generate schedule: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerate schedule when inputs change with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (startDate && endDate && rentAmount) {
        console.log('🔄 Input changed, regenerating schedule...');
        generatePaymentSchedule();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [startDate, endDate, rentAmount, paymentFrequency, paymentDay]);

  // Manual regenerate handler
  const handleManualRegenerate = () => {
    console.log('🔄 Manual regenerate triggered');
    generatePaymentSchedule();
  };

  const canGenerateSchedule = startDate && endDate && rentAmount > 0;
  const totalScheduledAmount = paymentSchedule.reduce((sum, payment) => sum + payment.amount, 0);

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
        
        <div className="flex items-end">
          <Button 
            variant="outline" 
            onClick={handleManualRegenerate}
            disabled={isGenerating || !canGenerateSchedule}
          >
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Regenerate Schedule
          </Button>
        </div>
      </div>

      {/* Schedule Summary */}
      {paymentSchedule.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Generated {paymentSchedule.length} payments totaling {formatCurrency(totalScheduledAmount)}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Payment Schedule Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Payment Schedule</span>
            <span className="text-sm text-muted-foreground">
              {paymentSchedule.length} payments
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!canGenerateSchedule ? (
            <div className="py-8 text-center text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
              <p>Please fill in start date, end date, and rent amount to generate payment schedule</p>
            </div>
          ) : paymentSchedule.length > 0 ? (
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
                  {paymentSchedule.map((payment, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                          {formatDate(payment.dueDate)}
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
              {isGenerating ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p>Generating payment schedule...</p>
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
