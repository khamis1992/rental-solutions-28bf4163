
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
import { CalendarIcon, Loader2, RefreshCw } from 'lucide-react';
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

const PaymentScheduleEditor: React.FC<PaymentScheduleEditorProps> = ({
  agreementId,
  startDate,
  endDate,
  rentAmount,
  paymentFrequency,
  paymentDay,
  onFrequencyChange,
  onPaymentDayChange,
}) => {
  const [paymentSchedule, setPaymentSchedule] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate payment schedule based on inputs
  const generatePaymentSchedule = () => {
    if (!startDate || !endDate || !rentAmount) return [];
    
    setIsGenerating(true);
    
    try {
      const payments = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      let currentDate = new Date(start);
      
      // Set day of month if specified
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
      
      // Generate schedule
      while (currentDate <= end) {
        payments.push({
          dueDate: new Date(currentDate),
          amount: Math.round(amount * 100) / 100,
          status: 'pending'
        });
        
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
      
      setPaymentSchedule(payments);
      return payments;
    } catch (error) {
      console.error("Error generating payment schedule:", error);
      return [];
    } finally {
      setIsGenerating(false);
    }
  };

  // Regenerate schedule when inputs change
  useEffect(() => {
    generatePaymentSchedule();
  }, [startDate, endDate, rentAmount, paymentFrequency, paymentDay]);

  return (
    <div className="space-y-6">
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
          <Label htmlFor="paymentDay">Payment Day (1-31)</Label>
          <Input 
            id="paymentDay"
            type="number" 
            min={1} 
            max={31} 
            value={paymentDay} 
            onChange={(e) => onPaymentDayChange(parseInt(e.target.value) || 1)}
          />
        </div>
        
        <div className="flex items-end">
          <Button 
            variant="outline" 
            onClick={generatePaymentSchedule}
            disabled={isGenerating}
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
          {paymentSchedule.length > 0 ? (
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
