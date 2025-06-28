import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Save, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import VehicleSelector from '@/components/vehicles/VehicleSelector';
import CustomerSelector from '@/components/customers/CustomerSelector';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Customer = Database['public']['Tables']['profiles']['Row'];
type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type Lease = Database['public']['Tables']['leases']['Insert'];

interface AgreementFormWithVehicleCheckProps {
  onSubmit?: (agreement: Lease) => void;
  initialData?: Partial<Lease>;
  isEdit?: boolean;
}

const AgreementFormWithVehicleCheck: React.FC<AgreementFormWithVehicleCheckProps> = ({
  onSubmit,
  initialData,
  isEdit = false
}) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleStatus, setVehicleStatus] = useState<string>('');
  const [isCheckingVehicle, setIsCheckingVehicle] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [formData, setFormData] = useState<Lease>({
    customer_id: '',
    vehicle_id: '',
    agreement_number: '',
    start_date: '',
    end_date: '',
    rent_amount: 0,
    deposit_amount: 0,
    status: 'draft',
    terms: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        customer_id: initialData.customer_id || '',
        vehicle_id: initialData.vehicle_id || '',
        agreement_number: initialData.agreement_number || '',
        start_date: initialData.start_date || '',
        end_date: initialData.end_date || '',
        rent_amount: initialData.rent_amount || 0,
        deposit_amount: initialData.deposit_amount || 0,
        status: initialData.status || 'draft',
        terms: initialData.terms || '',
      });
    }
  }, [initialData]);

  useEffect(() => {
    setCanProceed(!!selectedCustomer && !!selectedVehicle && vehicleStatus === 'available');
  }, [selectedCustomer, selectedVehicle, vehicleStatus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleCheckVehicle = async () => {
    if (!selectedVehicle) {
      toast.error('الرجاء اختيار مركبة');
      return;
    }

    setIsCheckingVehicle(true);
    try {
      const { data, error } = await supabase
        .from('leases')
        .select('id')
        .eq('vehicle_id', selectedVehicle.id)
        .eq('status', 'active')
        .single();

      if (error) {
        console.error('Error checking vehicle availability:', error);
        toast.error('فشل في التحقق من حالة المركبة');
        setVehicleStatus('unknown');
        return;
      }

      if (data) {
        setVehicleStatus('rented');
        toast.error('المركبة مؤجرة حالياً');
        setCanProceed(false);
      } else {
        setVehicleStatus('available');
        toast.success('المركبة متاحة');
        setCanProceed(true);
      }
    } finally {
      setIsCheckingVehicle(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canProceed || !selectedCustomer || !selectedVehicle) {
      toast.error('يرجى التأكد من جميع البيانات المطلوبة');
      return;
    }

    const agreementData: Lease = {
      ...formData,
      customer_id: selectedCustomer.id,
      vehicle_id: selectedVehicle.id,
    };

    if (onSubmit) {
      onSubmit(agreementData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            معلومات العميل والمركبة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer">العميل</Label>
              <CustomerSelector
                onSelect={setSelectedCustomer}
                value={selectedCustomer}
              />
            </div>
            
            <div>
              <Label htmlFor="vehicle">المركبة</Label>
              <VehicleSelector
                onSelect={setSelectedVehicle}
                value={selectedVehicle}
                onStatusChange={setVehicleStatus}
              />
            </div>
          </div>

          {vehicleStatus && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                حالة المركبة: {vehicleStatus}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            بيانات الاتفاقية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agreement_number">رقم الاتفاقية</Label>
              <Input
                type="text"
                id="agreement_number"
                name="agreement_number"
                value={formData.agreement_number}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <Label htmlFor="start_date">تاريخ البداية</Label>
              <Input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="end_date">تاريخ النهاية</Label>
              <Input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <Label htmlFor="rent_amount">مبلغ الإيجار</Label>
              <Input
                type="number"
                id="rent_amount"
                name="rent_amount"
                value={formData.rent_amount}
                onChange={handleNumberInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deposit_amount">مبلغ التأمين</Label>
              <Input
                type="number"
                id="deposit_amount"
                name="deposit_amount"
                value={formData.deposit_amount}
                onChange={handleNumberInputChange}
              />
            </div>
            
            <div>
              <Label htmlFor="status">الحالة</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر الحالة" defaultValue={formData.status} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline">
          <Eye className="h-4 w-4 mr-2" />
          معاينة
        </Button>
        <Button type="submit" disabled={!canProceed}>
          <Save className="h-4 w-4 mr-2" />
          حفظ الاتفاقية
        </Button>
      </div>
    </form>
  );
};

export default AgreementFormWithVehicleCheck;
