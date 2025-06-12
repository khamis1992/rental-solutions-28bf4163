
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, DollarSign } from 'lucide-react';
import { format, addMonths, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface PaymentScheduleEditorProps {
  agreementId?: string;
  startDate?: Date;
  endDate?: Date;
  rentAmount?: number;
  paymentFrequency?: 'monthly' | 'weekly' | 'daily';
  paymentDay?: number;
  onFrequencyChange?: (value: string) => void;
  onPaymentDayChange?: (value: number) => void;
  onClose?: () => void;
}

export function PaymentScheduleEditor({ 
  agreementId, 
  startDate,
  endDate,
  rentAmount = 0,
  paymentFrequency = 'monthly',
  paymentDay = 1,
  onFrequencyChange,
  onPaymentDayChange,
  onClose 
}: PaymentScheduleEditorProps) {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchExistingSchedule = async () => {
      if (!agreementId) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/payment-schedule?agreementId=${agreementId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setSchedule(data);
      } catch (error) {
        console.error("Could not fetch payment schedule:", error);
        toast.error("Failed to load payment schedule.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingSchedule();
  }, [agreementId]);

  const totalScheduledAmount = schedule.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);

  const formatDate = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };

  const addPayment = () => {
    const lastPayment = schedule.length > 0 ? schedule[schedule.length - 1] : null;
    const newDate = lastPayment ? addMonths(parseISO(lastPayment.due_date), 1) : new Date();

    setSchedule([
      ...schedule,
      {
        due_date: formatDate(newDate),
        amount: 0,
      },
    ]);
  };

  const updatePayment = (index: number, field: string, value: any) => {
    const newSchedule = [...schedule];
    newSchedule[index][field] = value;
    setSchedule(newSchedule);
  };

  const removePayment = (index: number) => {
    const newSchedule = [...schedule];
    newSchedule.splice(index, 1);
    setSchedule(newSchedule);
  };

  const handleSave = async () => {
    if (!agreementId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/payment-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agreementId: agreementId,
          schedule: schedule.map(item => ({
            due_date: item.due_date,
            amount: item.amount
          }))
        })
      });

      if (response.ok) {
        toast.success("Payment schedule saved successfully!");
        if (onClose) onClose();
      } else {
        toast.error("Failed to save payment schedule.");
      }
    } catch (error) {
      console.error("Error saving payment schedule:", error);
      toast.error("Failed to save payment schedule.");
    } finally {
      setIsLoading(false);
    }
  };

  if (onClose) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <CardTitle>Payment Schedule Editor</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="mb-4">
              <Badge variant="secondary">
                Total Scheduled Amount: <DollarSign className="h-4 w-4 inline-block align-middle mr-1" />{totalScheduledAmount}
              </Badge>
            </div>
            <Button variant="outline" className="mb-4" onClick={addPayment}>
              <Plus className="h-4 w-4 mr-2" /> Add Payment
            </Button>
          
          {schedule.map((payment: any, index: number) => (
            <div key={index} className="flex items-center space-x-4 p-4 border rounded">
              <div className="flex-1">
                <Label htmlFor={`date-${index}`}>Due Date</Label>
                <Input
                  type="date"
                  id={`date-${index}`}
                  value={payment.due_date}
                  onChange={(e) => updatePayment(index, 'due_date', e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor={`amount-${index}`}>Amount</Label>
                <Input
                  type="number"
                  id={`amount-${index}`}
                  value={payment.amount}
                  onChange={(e) => updatePayment(index, 'amount', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => removePayment(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          </CardContent>
          <div className="flex justify-end space-x-2 p-4">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              Save Schedule
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Payment Frequency</Label>
          <select 
            className="w-full border rounded p-2"
            value={paymentFrequency}
            onChange={(e) => onFrequencyChange?.(e.target.value)}
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="daily">Daily</option>
          </select>
        </div>
        <div>
          <Label>Payment Day</Label>
          <Input
            type="number"
            min="1"
            max="31"
            value={paymentDay}
            onChange={(e) => onPaymentDayChange?.(parseInt(e.target.value))}
          />
        </div>
      </div>
      
      <div className="border rounded p-4">
        <h3 className="font-medium mb-2">Schedule Preview</h3>
        <p className="text-sm text-muted-foreground">
          Payment schedule will be generated based on the agreement dates and frequency.
        </p>
      </div>
    </div>
  );
}

export default PaymentScheduleEditor;
