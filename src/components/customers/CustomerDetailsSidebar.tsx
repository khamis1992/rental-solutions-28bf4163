
import React, { useState } from 'react';
import { CustomerInfo } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  Sheet, 
  SheetClose, 
  SheetContent, 
  SheetDescription, 
  SheetFooter, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Phone,
  MapPin,
  FileText,
  User,
  Calendar,
  CreditCard,
  Car,
  AlertTriangle,
  Pencil,
  ArrowUpRight,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Agreement } from '@/types/agreement';
import { formatCurrency } from '@/lib/formatters';
import { useRentAmount } from '@/hooks/use-rent-amount';
import { errorLogger } from '@/lib/errors/error-logger';

interface CustomerDetailsSidebarProps {
  customer: CustomerInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CustomerDetailsSidebar: React.FC<CustomerDetailsSidebarProps> = ({
  customer,
  open,
  onOpenChange
}) => {
  // Early return if customer is null to prevent React hooks errors
  if (!customer) {
    return null;
  }
  
  const [activeTab, setActiveTab] = useState<string>('contact');
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Function to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Fetch agreements when customer changes or agreements tab is selected
  React.useEffect(() => {
    if (activeTab !== 'agreements') {
      return;
    }
    
    const fetchAgreements = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('leases')
          .select('*, vehicles(*)')
          .eq('customer_id', customer.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          errorLogger.logError(error, {
            context: 'CustomerDetailsSidebar.fetchAgreements',
            customerId: customer.id,
            action: 'fetch_customer_agreements'
          });
          return;
        }
        
        setAgreements(data || []);
      } catch (error) {
        errorLogger.logError(error as Error, {
          context: 'CustomerDetailsSidebar.fetchAgreements',
          customerId: customer.id,
          action: 'fetch_customer_agreements_catch'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAgreements();
  }, [customer.id, activeTab]); // Stable dependencies

  // Function to get the appropriate badge for an agreement status
  const getAgreementStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: string, label: string }> = {
      active: { variant: "success", label: "نشط" },
      pending: { variant: "warning", label: "معلق" },
      expired: { variant: "inactive", label: "منتهي" },
      cancelled: { variant: "destructive", label: "ملغي" },
      closed: { variant: "secondary", label: "مغلق" },
    };

    const { variant, label } = statusConfig[status] || statusConfig.active;
    
    return (
      <Badge variant={variant as any}>
        {label}
      </Badge>
    );
  };

  // Function to get the appropriate badge for a customer status
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: string, icon: any, label: string }> = {
      active: { variant: "success", icon: CheckCircle, label: "نشط" },
      inactive: { variant: "inactive", icon: XCircle, label: "غير نشط" },
      blacklisted: { variant: "destructive", icon: XCircle, label: "محظور" },
      pending_review: { variant: "warning", icon: AlertTriangle, label: "قيد المراجعة" },
      pending_payment: { variant: "info", icon: AlertTriangle, label: "انتظار دفع" },
    };

    const { variant, icon: Icon, label } = statusConfig[status] || statusConfig.active;
    
    return (
      <Badge variant={variant as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  // Format date for better display
  const formatDate = (dateString: string | Date | undefined): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get payment frequency display text
  const getPaymentFrequencyText = (frequency?: string) => {
    if (!frequency) return '';
    return `(${frequency})`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 space-y-2" dir="rtl">
          <SheetTitle className="text-xl font-bold text-right">تفاصيل العميل</SheetTitle>
          <SheetDescription className="text-right">
            عرض وإدارة معلومات العميل
          </SheetDescription>
        </SheetHeader>
        
        {/* Customer Profile Card */}
        <div className="py-6" dir="rtl">
          <div className="flex items-center gap-4 mb-4 flex-row-reverse">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
              {customer.full_name.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold">{customer.full_name}</h2>
              <p className="text-sm text-muted-foreground">معرف العميل: {customer.id.substring(0, 8)}</p>
              <div className="flex gap-2 mt-1 flex-row-reverse">
                {customer.status && getStatusBadge(customer.status)}
              </div>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <Tabs defaultValue="contact" value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="contact">التواصل</TabsTrigger>
              <TabsTrigger value="documents">الوثائق</TabsTrigger>
              <TabsTrigger value="agreements">العقود</TabsTrigger>
              <TabsTrigger value="notes">الملاحظات</TabsTrigger>
            </TabsList>
            
            <TabsContent value="contact" className="space-y-4 pt-4" dir="rtl">
              <div className="grid gap-2">
                <div className="flex justify-between items-center flex-row-reverse">
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <Mail className="h-4 w-4" />
                    <span>{customer.email}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(customer.email)}>
                    <span className="sr-only">نسخ البريد الإلكتروني</span>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 2V1H10V2H5ZM4.75 0C4.33579 0 4 0.335786 4 0.75V1H3.5C2.67157 1 2 1.67157 2 2.5V12.5C2 13.3284 2.67157 14 3.5 14H11.5C12.3284 14 13 13.3284 13 12.5V2.5C13 1.67157 12.3284 1 11.5 1H11V0.75C11 0.335786 10.6642 0 10.25 0H4.75ZM11 2V2.25C11 2.66421 10.6642 3 10.25 3H4.75C4.33579 3 4 2.66421 4 2.25V2H3.5C3.22386 2 3 2.22386 3 2.5V12.5C3 12.7761 3.22386 13 3.5 13H11.5C11.7761 13 12 12.7761 12 12.5V2.5C12 2.22386 11.7761 2 11.5 2H11Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                  </Button>
                </div>
                
                <div className="flex justify-between items-center flex-row-reverse">
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <Phone className="h-4 w-4" />
                    <span className="phone-number-ltr" dir="ltr">{customer.phone_number}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => copyToClipboard(customer.phone_number || '')}>
                    <span className="sr-only">نسخ الهاتف</span>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 2V1H10V2H5ZM4.75 0C4.33579 0 4 0.335786 4 0.75V1H3.5C2.67157 1 2 1.67157 2 2.5V12.5C2 13.3284 2.67157 14 3.5 14H11.5C12.3284 14 13 13.3284 13 12.5V2.5C13 1.67157 12.3284 1 11.5 1H11V0.75C11 0.335786 10.6642 0 10.25 0H4.75ZM11 2V2.25C11 2.66421 10.6642 3 10.25 3H4.75C4.33579 3 4 2.66421 4 2.25V2H3.5C3.22386 2 3 2.22386 3 2.5V12.5C3 12.7761 3.22386 13 3.5 13H11.5C11.7761 13 12 12.7761 12 12.5V2.5C12 2.22386 11.7761 2 11.5 2H11Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                  </Button>
                </div>
                
                {customer.address && (
                  <div className="flex justify-between items-center flex-row-reverse">
                    <div className="flex items-center gap-2 flex-row-reverse">
                      <MapPin className="h-4 w-4" />
                      <span>{customer.address}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(customer.address || '')}>
                      <span className="sr-only">نسخ العنوان</span>
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 2V1H10V2H5ZM4.75 0C4.33579 0 4 0.335786 4 0.75V1H3.5C2.67157 1 2 1.67157 2 2.5V12.5C2 13.3284 2.67157 14 3.5 14H11.5C12.3284 14 13 13.3284 13 12.5V2.5C13 1.67157 12.3284 1 11.5 1H11V0.75C11 0.335786 10.6642 0 10.25 0H4.75ZM11 2V2.25C11 2.66421 10.6642 3 10.25 3H4.75C4.33579 3 4 2.66421 4 2.25V2H3.5C3.22386 2 3 2.22386 3 2.5V12.5C3 12.7761 3.22386 13 3.5 13H11.5C11.7761 13 12 12.7761 12 12.5V2.5C12 2.22386 11.7761 2 11.5 2H11Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                    </Button>
                  </div>
                )}
                
                <div className="flex justify-between items-center flex-row-reverse">
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <User className="h-4 w-4" />
                    <span>الجنسية: {customer.nationality || 'غير محدد'}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center flex-row-reverse">
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <FileText className="h-4 w-4" />
                    <span>رخصة القيادة: {customer.driver_license || 'غير محدد'}</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="documents" className="space-y-4 pt-4" dir="rtl">
              <div className="rounded-md border p-4 flex flex-col items-center justify-center text-center">
                <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="font-medium">الوثائق</h3>
                <p className="text-muted-foreground text-sm mb-4">عرض وإدارة وثائق العميل.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="agreements" className="space-y-4 pt-4" dir="rtl">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <span className="mr-2">جاري تحميل العقود...</span>
                </div>
              ) : agreements.length > 0 ? (
                <div className="space-y-3">
                  {agreements.map((agreement) => (
                    <Card key={agreement.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => window.open(`/agreements/${agreement.id}`, '_blank')}>
                      <CardHeader className="p-3 pb-0">
                        <div className="flex justify-between items-center flex-row-reverse">
                          <div className="text-right">
                            <CardTitle className="text-sm font-medium">
                              {agreement.agreement_number || `عقد #${agreement.id.substring(0, 6)}`}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(agreement.start_date)} - {formatDate(agreement.end_date)}
                            </p>
                          </div>
                          {getAgreementStatusBadge(agreement.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-2">
                        <div className="flex gap-1 items-center text-xs flex-row-reverse">
                          <Car className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">
                            {agreement.vehicles?.license_plate || agreement.license_plate || 'غير متوفر'}
                          </span>
                          {' - '}
                          <span className="text-muted-foreground">
                            {agreement.vehicles?.make || agreement.vehicle_make || ''} {agreement.vehicles?.model || agreement.vehicle_model || ''}
                          </span>
                        </div>
                        <div className="flex gap-1 items-center mt-1 text-xs flex-row-reverse">
                          <CreditCard className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">
                            ريال {formatCurrency(agreement.rent_amount || 0)}
                          </span>
                          {agreement.payment_frequency && (
                            <span className="text-muted-foreground">
                              ({getPaymentFrequencyText(agreement.payment_frequency)})
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {agreements.length > 3 && (
                    <div className="text-center">
                      <Button 
                        variant="link" 
                        size="sm"
                        asChild
                      >
                        <Link to={`/customers/${customer.id}`}>
                          عرض جميع العقود
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-md border p-4 flex flex-col items-center justify-center text-center">
                  <Car className="h-10 w-10 text-muted-foreground mb-2" />
                  <h3 className="font-medium">لا توجد عقود</h3>
                  <p className="text-muted-foreground text-sm mb-4">هذا العميل ليس لديه أي عقود نشطة أو سابقة.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="notes" className="space-y-4 pt-4" dir="rtl">
              <div className="rounded-md border p-4 flex flex-col items-center justify-center text-center">
                <AlertTriangle className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="font-medium">لا توجد ملاحظات</h3>
                <p className="text-muted-foreground text-sm mb-4">لم يتم إضافة أي ملاحظات لهذا العميل.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <SheetFooter className="flex flex-col sm:flex-row gap-2" dir="rtl">
          <Button asChild variant="outline">
            <Link to={`/customers/edit/${customer.id}`}>
              <Pencil className="h-4 w-4 ml-2" />
              تعديل العميل
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/customers/${customer.id}`}>
              <ArrowUpRight className="h-4 w-4 ml-2" />
              الملف الكامل
            </Link>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
