import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Loader2, Plus } from 'lucide-react';
import { VehicleSelector } from '@/components/vehicles/VehicleSelector';
import { CustomerSelector } from '@/components/customers/CustomerSelector';
import type { Database } from '@/types/database.types';

// Remove unused types
type PaymentRecord = {
  id: string;
  amount: number;
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
  due_date: string;
};

interface AgreementFormData {
  customer_id: string;
  vehicle_id: string;
  lease_start: string;
  lease_end: string;
  monthly_rent: number;
  deposit: number;
  status: 'draft' | 'active' | 'expired' | 'terminated';
  terms: string;
  payment_day_of_month: number;
}

const AgreementFormWithVehicleCheck = () => {
  const [formData, setFormData] = useState<AgreementFormData>({
    customer_id: '',
    vehicle_id: '',
    lease_start: new Date().toISOString().split('T')[0],
    lease_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    monthly_rent: 0,
    deposit: 0,
    status: 'draft',
    terms: '',
    payment_day_of_month: new Date().getDate(),
  });
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const generatePaymentSchedule = (startDate: Date, endDate: Date, monthlyRent: number, paymentDay: number): PaymentRecord[] => {
    const payments: PaymentRecord[] = [];
    const current = new Date(startDate);
    let paymentId = 1;

    while (current <= endDate) {
      const paymentDate = new Date(current.getFullYear(), current.getMonth(), paymentDay);
      
      // If payment day is past current month's end, set to last day of month
      if (paymentDate.getDate() !== paymentDay) {
        paymentDate.setDate(0); // Last day of previous month
      }

      payments.push({
        id: `payment_${paymentId}`,
        amount: monthlyRent,
        status: 'pending' as const,
        due_date: paymentDate.toISOString().split('T')[0]
      });

      current.setMonth(current.getMonth() + 1);
      paymentId++;
    }

    return payments;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !selectedVehicle) {
      toast.error('يرجى اختيار العميل والمركبة');
      return;
    }

    try {
      setIsSubmitting(true);

      // Generate payment schedule
      const startDate = new Date(formData.lease_start);
      const endDate = new Date(formData.lease_end);
      const paymentSchedule = generatePaymentSchedule(
        startDate,
        endDate,
        formData.monthly_rent,
        formData.payment_day_of_month
      );

      // Create agreement
      const { data: agreement, error: agreementError } = await supabase
        .from('leases')
        .insert([{
          ...formData,
          customer_id: selectedCustomer.id,
          vehicle_id: selectedVehicle.id,
          payment_schedule: paymentSchedule
        }])
        .select()
        .single();

      if (agreementError) throw agreementError;

      toast.success('تم إنشاء الاتفاقية بنجاح');
      navigate(`/agreements/${agreement.id}`);
    } catch (error) {
      console.error('Error creating agreement:', error);
      toast.error('حدث خطأ أثناء إنشاء الاتفاقية');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle>إنشاء اتفاقية جديدة</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="customer_id">العميل</Label>
            <CustomerSelector onCustomerSelect={(customer) => setSelectedCustomer(customer)} selectedCustomer={selectedCustomer} />
          </div>
          <div>
            <Label htmlFor="vehicle_id">المركبة</Label>
            <VehicleSelector onVehicleSelect={(vehicle) => setSelectedVehicle(vehicle)} />
          </div>
          <div>
            <Label htmlFor="lease_start">تاريخ البداية</Label>
            <Input
              type="date"
              id="lease_start"
              name="lease_start"
              value={formData.lease_start}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="lease_end">تاريخ النهاية</Label>
            <Input
              type="date"
              id="lease_end"
              name="lease_end"
              value={formData.lease_end}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="monthly_rent">الإيجار الشهري</Label>
            <Input
              type="number"
              id="monthly_rent"
              name="monthly_rent"
              value={formData.monthly_rent}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="deposit">التأمين</Label>
            <Input
              type="number"
              id="deposit"
              name="deposit"
              value={formData.deposit}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="payment_day_of_month">يوم الدفع من الشهر</Label>
            <Input
              type="number"
              id="payment_day_of_month"
              name="payment_day_of_month"
              value={formData.payment_day_of_month}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="status">الحالة</Label>
            <Select onValueChange={(value) => handleSelectChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="active">نشطة</SelectItem>
                <SelectItem value="expired">منتهية</SelectItem>
                <SelectItem value="terminated">تم إنهاؤها</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="terms">الشروط</Label>
            <Textarea
              id="terms"
              name="terms"
              value={formData.terms}
              onChange={handleInputChange}
              className="resize-none"
            />
          </div>
          <Button disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري الإنشاء...</span>
              </div>
            ) : (
              <>
                <Plus className="w-4 h-4 ml-2" />
                إنشاء اتفاقية
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AgreementFormWithVehicleCheck;
