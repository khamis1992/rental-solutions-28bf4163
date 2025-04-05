
import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatDateTime } from '@/lib/date-utils';
import { useTranslation as useContextTranslation } from '@/contexts/TranslationContext';

// Lazy load components that aren't immediately visible
const CustomerTrafficFines = lazy(() => import('./CustomerTrafficFines').then(module => ({ default: module.CustomerTrafficFines })));
const AgreementHistorySection = lazy(() => import('./AgreementHistorySection').then(module => ({ default: module.AgreementHistorySection })));

export interface CustomerDetailProps {
  id: string;
}

export function CustomerDetail({ id }: CustomerDetailProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getCustomer, deleteCustomer } = useCustomers();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { isRTL, translateText } = useContextTranslation();
  const [translatedNotes, setTranslatedNotes] = useState<string | null>(null);
  // State for tracking which sections are visible
  const [showAgreements, setShowAgreements] = useState(false);
  const [showTrafficFines, setShowTrafficFines] = useState(false);

  const fetchCustomer = useCallback(async () => {
    if (!id || hasLoaded) return;
    
    setLoading(true);
    setFetchError(null);
    
    try {
      const data = await getCustomer(id);
      if (data) {
        setCustomer(data);
        setHasLoaded(true);
        
        // Translate customer notes if available
        if (data.notes) {
          try {
            const translated = await translateText(data.notes);
            setTranslatedNotes(translated);
          } catch (error) {
            console.error("Error translating notes:", error);
            setTranslatedNotes(data.notes); // Fall back to original notes
          }
        }
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
  }, [id, getCustomer, hasLoaded, t, translateText]);

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
              <p className="text-foreground">{customer.email || t('common.notProvided')}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">{t('customers.phoneNumber')}</h4>
              <p className="text-foreground">{customer.phone || t('common.notProvided')}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">{t('customers.address')}</h4>
              <p className="text-foreground whitespace-pre-line">{customer.address || t('customers.noAddressProvided')}</p>
            </div>
            {customer.nationality && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">{t('common.nationality')}</h4>
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

      {/* Lazy loaded agreement history section - only loads when visible */}
      <Card>
        <CardHeader>
          <Button 
            variant="ghost" 
            onClick={() => setShowAgreements(!showAgreements)}
            className="flex w-full items-center justify-between p-0 hover:bg-transparent"
          >
            <CardTitle className="flex items-center">
              <FileText className={`${isRTL ? 'ml-2' : 'mr-2'} h-5 w-5`} />
              {t('customers.agreementHistory')}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {showAgreements ? t('common.hide') : t('common.show')}
            </span>
          </Button>
          <CardDescription>
            {t('customers.agreementList')}
          </CardDescription>
        </CardHeader>
        {showAgreements && (
          <Suspense fallback={
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </CardContent>
          }>
            <AgreementHistorySection customerId={id} />
          </Suspense>
        )}
      </Card>

      {/* Lazy loaded traffic fines section - only loads when visible */}
      <Card>
        <CardHeader>
          <Button 
            variant="ghost" 
            onClick={() => setShowTrafficFines(!showTrafficFines)}
            className="flex w-full items-center justify-between p-0 hover:bg-transparent"
          >
            <CardTitle className="flex items-center">
              <AlertTriangle className={`${isRTL ? 'ml-2' : 'mr-2'} h-5 w-5`} />
              {t('customers.trafficFines')}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {showTrafficFines ? t('common.hide') : t('common.show')}
            </span>
          </Button>
          <CardDescription>
            {t('customers.trafficViolations')}
          </CardDescription>
        </CardHeader>
        {showTrafficFines && (
          <CardContent>
            <Suspense fallback={<Skeleton className="h-48 w-full" />}>
              <CustomerTrafficFines customerId={id} />
            </Suspense>
          </CardContent>
        )}
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('customers.additionalNotes')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            {customer.notes ? (
              <p className="whitespace-pre-line">{translatedNotes || customer.notes}</p>
            ) : (
              <p className="text-muted-foreground italic">{t('customers.noAdditionalNotes')}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
