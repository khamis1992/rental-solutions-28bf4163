
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Edit, Trash2, UserCog, CalendarClock, Clock, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useCustomers } from '@/hooks/use-customers';
import { Customer } from '@/lib/validation-schemas/customer';
import { toast } from 'sonner';
import { CustomerTrafficFines } from './CustomerTrafficFines';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDate, formatDateTime } from '@/lib/date-utils';
import { useAgreements } from '@/hooks/use-agreements';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation as useContextTranslation } from '@/contexts/TranslationContext';

export interface CustomerDetailProps {
  id: string;
}

export function CustomerDetail({ id }: CustomerDetailProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getCustomer, deleteCustomer } = useCustomers();
  const { agreements, isLoading: isLoadingAgreements } = useAgreements({ 
    customerId: id
  });
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { isRTL } = useContextTranslation();

  const fetchCustomer = useCallback(async () => {
    if (!id || hasLoaded) return;
    
    setLoading(true);
    setFetchError(null);
    
    try {
      const data = await getCustomer(id);
      if (data) {
        setCustomer(data);
        setHasLoaded(true);
      } else {
        setFetchError(t('customers.errorLoadingTitle'));
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      setFetchError(t('customers.errorLoadingTitle'));
      toast.error(t('customers.errorLoadingTitle'));
    } finally {
      setLoading(false);
    }
  }, [id, getCustomer, hasLoaded, t]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleDelete = async () => {
    if (!customer?.id || isDeleting) return;
    
    setIsDeleting(true);
    try {
      await deleteCustomer.mutateAsync(customer.id, {
        onSuccess: () => {
          toast.success(t('customers.statusUpdateSuccess'));
          navigate('/customers');
        },
        onError: (error) => {
          console.error("Delete error:", error);
          toast.error(t('customers.statusUpdateFailed'));
          setIsDeleting(false);
        }
      });
    } catch (error) {
      console.error("Unexpected error during delete:", error);
      toast.error(t('customers.unexpectedError'));
      setIsDeleting(false);
    }
  };

  if (loading && !hasLoaded) {
    return <div className="flex justify-center items-center p-8">{t('common.loading')}</div>;
  }

  if (fetchError || !customer) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle>{t('customers.errorLoadingTitle')}</CardTitle>
          <CardDescription>
            {fetchError || t('customers.unknownError')}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link to="/customers">{t('common.back')}</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{customer.full_name}</h2>
          <p className="text-muted-foreground">
            {t('customers.customerSince')} {formatDate(customer.created_at || '')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline">
            <Link to={`/customers/edit/${customer.id}`}>
              <Edit className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
              {t('common.edit')}
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                {isDeleting ? t('common.loading') : t('common.delete')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('customers.deleteCustomerConfirmation', { name: customer.full_name })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  {t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCog className={`${isRTL ? 'ml-2' : 'mr-2'} h-5 w-5`} />
              {t('customers.contactInformation')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">{t('customers.emailAddress')}</h4>
              <p className="text-foreground">{customer.email}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">{t('customers.phoneNumber')}</h4>
              <p className="text-foreground">{customer.phone || customer.phone_number}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">{t('customers.address')}</h4>
              <p className="text-foreground whitespace-pre-line">{customer.address || t('customers.noAddressProvided')}</p>
            </div>
            {customer.nationality && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">{t('customers.nationality')}</h4>
                <p className="text-foreground">{customer.nationality}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarClock className={`${isRTL ? 'ml-2' : 'mr-2'} h-5 w-5`} />
              {t('customers.customerDetails')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">{t('common.status')}</h4>
              <Badge
                variant={
                  customer.status === "active" ? "success" : 
                  customer.status === "inactive" ? "outline" : 
                  customer.status === "blacklisted" ? "destructive" :
                  customer.status === "pending_review" ? "warning" :
                  "secondary"
                }
                className="capitalize"
              >
                {t(`customers.status.${customer.status?.replace('_', '') || 'unknown'}`)}
              </Badge>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">{t('customers.driverLicense')}</h4>
              <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                {customer.driver_license || t('customers.notProvided')}
              </code>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">{t('customers.lastUpdated')}</h4>
              <div className="flex items-center">
                <Clock className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 text-muted-foreground`} />
                {customer.updated_at 
                  ? formatDateTime(customer.updated_at) 
                  : t('customers.neverUpdated')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className={`${isRTL ? 'ml-2' : 'mr-2'} h-5 w-5`} />
            {t('customers.agreementHistory')}
          </CardTitle>
          <CardDescription>
            {t('customers.agreementList')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('agreements.title')}</TableHead>
                  <TableHead>{t('vehicles.title')}</TableHead>
                  <TableHead>{t('common.startDate')}</TableHead>
                  <TableHead>{t('common.endDate')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead>{t('common.total')}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingAgreements ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={`skeleton-cell-${i}-${j}`}>
                          <Skeleton className="h-6 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : agreements && agreements.length > 0 ? (
                  agreements.map((agreement) => (
                    <TableRow key={agreement.id}>
                      <TableCell className="font-medium">{agreement.agreement_number || t('common.notProvided')}</TableCell>
                      <TableCell>
                        {agreement.vehicle ? (
                          <span>
                            {agreement.vehicle.make} {agreement.vehicle.model} ({agreement.vehicle.license_plate})
                          </span>
                        ) : (
                          t('vehicles.unknown')
                        )}
                      </TableCell>
                      <TableCell>{agreement.start_date ? formatDate(agreement.start_date) : t('common.notProvided')}</TableCell>
                      <TableCell>{agreement.end_date ? formatDate(agreement.end_date) : t('common.notProvided')}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            agreement.status === 'ACTIVE' ? 'success' :
                            agreement.status === 'PENDING' ? 'warning' :
                            agreement.status === 'CANCELLED' ? 'destructive' :
                            agreement.status === 'CLOSED' ? 'outline' :
                            agreement.status === 'EXPIRED' ? 'secondary' :
                            'default'
                          }
                          className="capitalize"
                        >
                          {t(`agreements.status.${agreement.status?.toLowerCase().replace('_', '') || 'unknown'}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>{agreement.total_amount ? `QAR ${agreement.total_amount.toLocaleString()}` : t('common.notProvided')}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/agreements/${agreement.id}`}>
                            {t('common.view')}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      {t('agreements.noAgreements')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className={`${isRTL ? 'ml-2' : 'mr-2'} h-5 w-5`} />
            {t('customers.trafficFines')}
          </CardTitle>
          <CardDescription>
            {t('customers.trafficViolations')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerTrafficFines customerId={id} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('customers.additionalNotes')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            {customer.notes ? (
              <p className="whitespace-pre-line">{customer.notes}</p>
            ) : (
              <p className="text-muted-foreground italic">{t('customers.noAdditionalNotes')}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
