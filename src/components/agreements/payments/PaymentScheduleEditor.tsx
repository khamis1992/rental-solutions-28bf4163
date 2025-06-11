import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Calendar, DollarSign } from 'lucide-react';
import { format, addMonths, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { usePaymentScheduleMutation } from '@/hooks/use-payment-schedule';

interface PaymentScheduleEditorProps {
  agreementId: string;
  onClose: () => void;
}

export function PaymentScheduleEditor({ agreementId, onClose }: PaymentScheduleEditorProps) {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const paymentScheduleMutation = usePaymentScheduleMutation();

  useEffect(() => {
    const fetchExistingSchedule = async () => {
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
    setIsLoading(true);
    try {
      const result = await paymentScheduleMutation.mutateAsync({
        agreementId: agreementId,
        schedule: schedule.map(item => ({
          due_date: item.due_date,
          amount: item.amount
        }))
      });

      if (result?.success) {
        toast.success("Payment schedule saved successfully!");
        onClose();
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
