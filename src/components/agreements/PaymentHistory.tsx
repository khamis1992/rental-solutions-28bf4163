
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, CreditCard, PlusCircle, CheckCircle, XCircle, RotateCcw, Loader2 } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';
import { reconcilePayments } from '@/lib/payment-utils';
import { toast } from 'sonner';
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
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SimpleAgreement } from '@/hooks/use-agreements';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Payment as PaymentType } from '@/hooks/use-payments';

// Re-export the Payment type for other components to use
export type Payment = PaymentType;

interface PaymentHistoryProps {
  agreementId: string;
  payments: Payment[];
  onPaymentsUpdated: (payments: Payment[]) => void;
}

const paymentFormSchema = z.object({
  amount: z.number().min(1, { message: "Amount must be at least 1" }),
  paymentDate: z.date({
    required_error: "A date is required.",
  }),
  paymentMethod: z.string().min(1, { message: "Payment method is required" }),
  description: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>

export function PaymentHistory({ agreementId, payments, onPaymentsUpdated }: PaymentHistoryProps) {
  const { t } = useTranslation();
  const { toast: uiToast } = useToast();
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [isReconciling, setIsReconciling] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [showCreatePaymentDialog, setShowCreatePaymentDialog] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('cash');
  const [newPaymentDescription, setNewPaymentDescription] = useState('');
  const [selectedPaymentDate, setSelectedPaymentDate] = useState<Date | undefined>(new Date());
  const [agreement, setAgreement] = useState<SimpleAgreement | null>(null);
  const [loadingAgreement, setLoadingAgreement] = useState(true);

  useEffect(() => {
    const fetchAgreement = async () => {
      setLoadingAgreement(true);
      try {
        const { data, error } = await supabase
          .from('leases')
          .select('*')
          .eq('id', agreementId)
          .single();

        if (error) {
          console.error('Error fetching agreement:', error);
          uiToast({
            title: 'Error',
            description: `Failed to load agreement: ${error.message}`,
            variant: 'destructive',
          });
        } else {
          setAgreement(data as SimpleAgreement);
        }
      } finally {
        setLoadingAgreement(false);
      }
    };

    fetchAgreement();
  }, [agreementId, uiToast]);

  const reconcileForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 0,
      paymentDate: new Date(),
      paymentMethod: 'cash',
      description: ''
    },
    mode: "onChange"
  });

  const {
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = reconcileForm;

  const handleDateChange = (newDate: Date | undefined) => {
    setSelectedPaymentDate(newDate);
    reconcileForm.setValue("paymentDate", newDate || new Date());
  };

  const handleAmountChange = (value: string) => {
    setNewPaymentAmount(value);
    const parsedAmount = parseFloat(value);
    reconcileForm.setValue("amount", isNaN(parsedAmount) ? 0 : parsedAmount);
  };

  const handleMethodChange = (method: string) => {
    setNewPaymentMethod(method);
    reconcileForm.setValue("paymentMethod", method);
  };

  const handleDescriptionChange = (description: string) => {
    setNewPaymentDescription(description);
    reconcileForm.setValue("description", description);
  };

  const handleOpenCreatePaymentDialog = () => {
    setShowCreatePaymentDialog(true);
  };

  const handleCloseCreatePaymentDialog = () => {
    setShowCreatePaymentDialog(false);
    reset();
    setNewPaymentAmount('');
    setNewPaymentMethod('cash');
    setNewPaymentDescription('');
    setSelectedPaymentDate(new Date());
  };

  const handleReconcilePayments = async (data: PaymentFormValues) => {
    if (!agreement) {
      toast.error('Agreement details not loaded. Please try again.');
      return;
    }

    setIsReconciling(true);
    try {
      const updatedPayments = await reconcilePayments(
        agreement,
        data.amount,
        data.paymentDate,
        data.paymentMethod,
        data.description
      );

      onPaymentsUpdated(updatedPayments);
      toast.success('Payment recorded successfully!');
      handleCloseCreatePaymentDialog();
    } catch (error) {
      console.error('Error during payment reconciliation:', error);
      toast.error('Failed to record payment. Please try again.');
    } finally {
      setIsReconciling(false);
    }
  };

  const handleCreatePayment = async (
    agreement: SimpleAgreement, 
    amount: number, 
    paymentDate: Date | null,
    paymentMethod: string = 'cash',
    description: string
  ) => {
    if (!agreement) {
      toast.error('Agreement details not loaded. Please try again.');
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Please enter a valid payment amount.');
      return;
    }

    if (!paymentDate) {
      toast.error('Please select a payment date.');
      return;
    }

    setIsCreatingPayment(true);
    try {
      const { data: newPayment, error } = await supabase
        .from('unified_payments')
        .insert([{
          lease_id: agreement.id,
          amount: amount,
          amount_paid: amount,
          payment_date: paymentDate.toISOString(),
          payment_method: paymentMethod,
          status: 'paid',
          type: 'Income',
          description: description || `Payment on ${formatDate(paymentDate)}`,
          transaction_id: `TXN-${Date.now()}`
        }])
        .select('*')
        .single();

      if (error) {
        console.error('Error creating payment:', error);
        toast.error(`Failed to create payment: ${error.message}`);
        return;
      }

      const updatedPayments = [...payments, newPayment];
      onPaymentsUpdated(updatedPayments);

      toast.success('Payment created successfully!');
      handleCloseCreatePaymentDialog();
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Failed to create payment. Please try again.');
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const calculateBalance = (payment: Payment): number => {
    return payment.amount - (payment.amount_paid || 0);
  };

  const totalBalance = payments.reduce((sum, payment) => sum + calculateBalance(payment), 0);

  if (loadingAgreement) {
    return (
      <Card>
        <div className="p-4">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-10 w-full mb-2" />
        </div>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium">{t('payments.paymentHistory')}</h3>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" /> {t('payments.reconcile')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('payments.reconcilePayments')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('payments.reconcilePaymentsDesc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={async () => {
                  if (agreement) {
                    setIsReconciling(true);
                    try {
                      const updatedPayments = await reconcilePayments(agreement);
                      onPaymentsUpdated(updatedPayments);
                      toast.success('Payments reconciled successfully!');
                    } catch (error) {
                      console.error('Error during payment reconciliation:', error);
                      toast.error('Failed to reconcile payments. Please try again.');
                    } finally {
                      setIsReconciling(false);
                    }
                  }
                }} disabled={isReconciling}>
                  {isReconciling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.reconciling')}...
                    </>
                  ) : (
                    t('payments.reconcile')
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" onClick={handleOpenCreatePaymentDialog}>
                <PlusCircle className="mr-2 h-4 w-4" /> {t('payments.addPayment')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('payments.addPayment')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('payments.addPaymentDesc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Form {...reconcileForm}>
                <form onSubmit={handleSubmit(handleReconcilePayments)} className="space-y-4">
                  <FormField
                    control={reconcileForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('payments.amount')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t('payments.amount')}
                            value={newPaymentAmount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={reconcileForm.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t("payments.paymentDate")}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-[240px] pl-3 text-left font-normal",
                                  !selectedPaymentDate && "text-muted-foreground"
                                )}
                              >
                                {selectedPaymentDate ? (
                                  formatDate(selectedPaymentDate)
                                ) : (
                                  <span>{t("payments.pickDate")}</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedPaymentDate}
                              onSelect={handleDateChange}
                              disabled={false}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={reconcileForm.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('payments.paymentMethod')}</FormLabel>
                        <Select onValueChange={handleMethodChange} defaultValue={newPaymentMethod}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('payments.selectMethod')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">{t('payments.cash')}</SelectItem>
                            <SelectItem value="card">{t('payments.card')}</SelectItem>
                            <SelectItem value="bank_transfer">{t('payments.bankTransfer')}</SelectItem>
                            <SelectItem value="cheque">{t('payments.cheque')}</SelectItem>
                            <SelectItem value="other">{t('payments.other')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={reconcileForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('payments.description')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('payments.description')}
                            className="resize-none"
                            value={newPaymentDescription}
                            onChange={(e) => handleDescriptionChange(e.target.value)}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('payments.descriptionHelp')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleCloseCreatePaymentDialog}>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction type="submit" disabled={!isValid || isCreatingPayment}>
                      {isCreatingPayment ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('common.creating')}...
                        </>
                      ) : (
                        t('payments.addPayment')
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </form>
              </Form>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('payments.date')}</TableHead>
              <TableHead>{t('payments.amount')}</TableHead>
              <TableHead>{t('payments.method')}</TableHead>
              <TableHead>{t('payments.description')}</TableHead>
              <TableHead>{t('payments.balance')}</TableHead>
              <TableHead className="text-right">{t('common.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.payment_date ? formatDate(new Date(payment.payment_date)) : '-'}</TableCell>
                <TableCell>{formatCurrency(payment.amount_paid || 0)}</TableCell>
                <TableCell>{payment.payment_method}</TableCell>
                <TableCell>{payment.notes || payment.description}</TableCell>
                <TableCell>{formatCurrency(calculateBalance(payment))}</TableCell>
                <TableCell className="text-right">
                  {payment.status === 'paid' ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      <CheckCircle className="mr-1 h-3 w-3" /> {t('payments.status.paid')}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
                      <XCircle className="mr-1 h-3 w-3" /> {t('payments.status.unpaid')}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex justify-between">
        <div className="text-sm font-medium">
          {t('payments.totalBalance')}: {formatCurrency(totalBalance)}
        </div>
        <div className="text-sm text-muted-foreground">
          {t('common.showing')} {payments.length} {t('payments.payments')}
        </div>
      </div>
    </div>
  );
}
