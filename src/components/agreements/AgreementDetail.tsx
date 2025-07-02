import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/formatters';
import { Loader2, Edit, Trash2, FileText, DollarSign, AlertCircle, Car, User, Calendar, MapPin } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Agreement, Customer, Vehicle, UnifiedPayment } from '@/types/database';

interface AgreementDetailsProps {
  agreement: Agreement;
  customer: Customer;
  vehicle: Vehicle;
  payments: UnifiedPayment[];
}

const AgreementDetails: React.FC<AgreementDetailsProps> = ({ agreement, customer, vehicle, payments }) => {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <CardTitle>تفاصيل الاتفاقية</CardTitle>
        <Badge variant="secondary">{agreement.status}</Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="payments">المدفوعات</TabsTrigger>
          <TabsTrigger value="documents">المستندات</TabsTrigger>
          <TabsTrigger value="history">سجل التغييرات</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>معلومات أساسية</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>رقم الاتفاقية: {agreement.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>تاريخ البداية: {agreement.lease_start}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>تاريخ الانتهاء: {agreement.lease_end}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>معلومات العميل</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{customer.full_name}</span>
                </div>
                {/* Add more customer details here */}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>معلومات المركبة</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  <span>{vehicle.make} {vehicle.model}</span>
                </div>
                {/* Add more vehicle details here */}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الشروط والأحكام</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{agreement.terms}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="payments">
          {/* Payment list component or details here */}
          <div>Payment Content</div>
        </TabsContent>
        <TabsContent value="documents">
          {/* Document list or upload section here */}
          <div>Documents Content</div>
        </TabsContent>
        <TabsContent value="history">
          {/* Agreement change history or audit log here */}
          <div>History Content</div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface AgreementDetailProps {
  id: string;
}

const AgreementDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [payments, setPayments] = useState<UnifiedPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) {
      toast.error('Agreement ID is missing');
      return;
    }

    const fetchAgreement = async () => {
      setIsLoading(true);
      try {
        const { data: agreementData, error: agreementError } = await supabase
          .from('leases')
          .select('*')
          .eq('id', id)
          .single();

        if (agreementError) throw agreementError;
        if (!agreementData) {
          toast.error('Agreement not found');
          navigate('/agreements');
          return;
        }

        setAgreement(agreementData);

        // Fetch related customer
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', agreementData.customer_id)
          .single();

        if (customerError) throw customerError;
        if (!customerData) {
          toast.error('Customer not found');
          return;
        }
        setCustomer(customerData);

        // Fetch related vehicle
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', agreementData.vehicle_id)
          .single();

        if (vehicleError) throw vehicleError;
        if (!vehicleData) {
          toast.error('Vehicle not found');
          return;
        }
        setVehicle(vehicleData);

        // Fetch payments (assuming you have a payments table)
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .eq('lease_id', id);

        if (paymentsError) throw paymentsError;
        setPayments(paymentsData || []);

      } catch (error) {
        console.error('Error fetching agreement details:', error);
        toast.error('Failed to load agreement details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgreement();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!agreement) return;
    
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('leases')
        .delete()
        .eq('id', agreement.id);

      if (error) throw error;

      toast.success('تم حذف الاتفاقية بنجاح');
      navigate('/agreements');
    } catch (error) {
      console.error('Error deleting agreement:', error);
      toast.error('حدث خطأ أثناء حذف الاتفاقية');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (!agreement || !customer || !vehicle) {
    return (
      <div className="flex items-center justify-center h-full">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <span className="ml-2">Agreement details not found.</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">
            تفاصيل الاتفاقية رقم: {agreement.id}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              onClick={() => navigate(`/agreements/edit/${agreement.id}`)}
            >
              <Edit className="w-4 h-4 ml-2" />
              تعديل
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم حذف هذه الاتفاقية بشكل دائم ولا يمكن التراجع عن هذا الإجراء.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction disabled={isDeleting} onClick={handleDelete}>
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        جاري الحذف...
                      </>
                    ) : (
                      "حذف"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent>
          <AgreementDetails agreement={agreement} customer={customer} vehicle={vehicle} payments={payments} />
        </CardContent>
      </Card>
    </div>
  );
};

export default AgreementDetail;
