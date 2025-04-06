
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Pencil, UserRound, Phone, Mail, MapPin, Clock, CalendarDays, FileText, AlertTriangle } from 'lucide-react';
import { DeleteCustomerDialog } from './DeleteCustomerDialog';
import { Customer, CustomerStatus } from '@/types/customer';
import { useTranslation } from 'react-i18next';
import { useTranslation as useAppTranslation } from '@/contexts/TranslationContext';
import { formatDate, ensureDate } from '@/lib/date-utils';
import { getDirectionalClasses } from '@/utils/rtl-utils';

interface CustomerDetailProps {
  customer: Customer;
  onDelete: (id: string) => Promise<void>;
}

export function CustomerDetail({ customer, onDelete }: CustomerDetailProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isRTL } = useAppTranslation();

  const handleEdit = () => {
    navigate(`/customers/edit/${customer.id}`);
  };

  const handleDelete = async () => {
    try {
      await onDelete(customer.id);
      // Navigation handled in parent component
      toast.success(t('customers.deleteSuccess'));
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error(t('customers.deleteError'));
    }
    setIsDeleteDialogOpen(false);
  };

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return t('common.notProvided');
    
    // If the phone number doesn't start with +974, add it
    if (!phone.startsWith('+974')) {
      return `+974 ${phone}`;
    }
    return phone;
  };

  const getStatusBadge = (status: CustomerStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">{t(`customers.status.${status}`)}</Badge>;
      case 'inactive':
        return <Badge variant="outline">{t(`customers.status.${status}`)}</Badge>;
      case 'blacklisted':
        return <Badge variant="destructive">{t(`customers.status.${status}`)}</Badge>;
      case 'pendingreview':
        return <Badge className="bg-yellow-500">{t('customers.status.pendingreview')}</Badge>;
      case 'pendingpayment':
        return <Badge className="bg-blue-500">{t('customers.status.pendingpayment')}</Badge>;
      default:
        return <Badge variant="outline">{status || t('common.unknown')}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className={`flex ${isRTL ? 'flex-row-reverse justify-between' : 'justify-between'}`}>
        <div>
          <h2 className={`text-3xl font-bold tracking-tight ${isRTL ? 'text-right' : ''}`}>
            {customer.full_name || t('customers.unnamed')}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge(customer.status)}
          </div>
        </div>
        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button onClick={handleEdit} variant="outline" className={isRTL ? 'ml-2' : 'mr-2'}>
            <Pencil className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('common.edit')}
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            {t('common.delete')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('customers.contactInformation')}</CardTitle>
            <CardDescription>{t('customers.customerDetails')}</CardDescription>
          </CardHeader>
          <CardContent className={`space-y-4 ${isRTL ? 'text-right' : ''}`}>
            <div className={`flex items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
              <UserRound className={`h-5 w-5 text-muted-foreground ${isRTL ? 'ml-3' : 'mr-3'} mt-0.5`} />
              <div>
                <Label>{t('common.name')}</Label>
                <p className="text-lg font-medium">{customer.full_name || t('common.notProvided')}</p>
              </div>
            </div>
            
            <div className={`flex items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Mail className={`h-5 w-5 text-muted-foreground ${isRTL ? 'ml-3' : 'mr-3'} mt-0.5`} />
              <div>
                <Label>{t('customers.emailAddress')}</Label>
                <p>{customer.email || t('common.notProvided')}</p>
              </div>
            </div>
            
            <div className={`flex items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Phone className={`h-5 w-5 text-muted-foreground ${isRTL ? 'ml-3' : 'mr-3'} mt-0.5`} />
              <div>
                <Label>{t('customers.phoneNumber')}</Label>
                <p>{formatPhoneNumber(customer.phone)}</p>
              </div>
            </div>
            
            <div className={`flex items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
              <MapPin className={`h-5 w-5 text-muted-foreground ${isRTL ? 'ml-3' : 'mr-3'} mt-0.5`} />
              <div>
                <Label>{t('common.address')}</Label>
                <p>{customer.address || t('customers.noAddressProvided')}</p>
              </div>
            </div>
            
            <div className={`flex items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
              <FileText className={`h-5 w-5 text-muted-foreground ${isRTL ? 'ml-3' : 'mr-3'} mt-0.5`} />
              <div>
                <Label>{t('customers.driverLicense')}</Label>
                <p>{customer.driver_license || t('common.notProvided')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('common.details')}</CardTitle>
            <CardDescription>{t('customers.additionalNotes')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <AlertTriangle className={`h-5 w-5 text-muted-foreground ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className="font-medium">{t('common.status')}</span>
              </div>
              <p className="mt-1">
                {getStatusBadge(customer.status)}
              </p>
            </div>
            
            <div>
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Clock className={`h-5 w-5 text-muted-foreground ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className="font-medium">{t('customers.lastUpdated')}</span>
              </div>
              <p className="mt-1">
                {ensureDate(customer.updated_at) ? formatDate(ensureDate(customer.updated_at)!) : t('customers.neverUpdated')}
              </p>
            </div>
            
            <div>
              <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <CalendarDays className={`h-5 w-5 text-muted-foreground ${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className="font-medium">{t('customers.customerSince')}</span>
              </div>
              <p className="mt-1">
                {ensureDate(customer.created_at) ? formatDate(ensureDate(customer.created_at)!) : t('common.unknown')}
              </p>
            </div>
            
            <Separator className="my-4" />
            
            <div>
              <Label className={isRTL ? 'text-right block' : ''}>{t('common.notes')}</Label>
              <p className={`whitespace-pre-line mt-2 ${isRTL ? 'text-right' : ''}`}>{customer.notes || t('customers.noAdditionalNotes')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <DeleteCustomerDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        customerName={customer.full_name || t('customers.unnamed')}
      />
    </div>
  );
}
