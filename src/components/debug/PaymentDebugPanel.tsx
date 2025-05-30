
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Bug, Database, Calendar } from 'lucide-react';
import { usePaymentScheduleManagement } from '@/hooks/payment/use-payment-schedule-management';
import { usePayments } from '@/hooks/use-payments';
import { usePaymentSync } from '@/hooks/payment/use-payment-sync';
import { formatDate } from '@/lib/date-utils';
import { Agreement } from '@/types/agreement';

interface PaymentDebugPanelProps {
  agreement: Agreement;
  isOpen?: boolean;
}

export function PaymentDebugPanel({ agreement, isOpen = false }: PaymentDebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(isOpen);
  const [activeTab, setActiveTab] = useState<'schedule' | 'payments' | 'sync'>('schedule');

  const {
    paymentSchedule,
    isLoading: isLoadingSchedule,
    error: scheduleError
  } = usePaymentScheduleManagement(agreement.id);

  const {
    payments,
    isLoading: isLoadingPayments,
    error: paymentsError
  } = usePayments(agreement.id);

  const { syncResults, fixAgreementSync, isPending } = usePaymentSync();

  const handleRunDiagnostics = async () => {
    try {
      await fixAgreementSync(agreement.id);
    } catch (error) {
      console.error('Diagnostics failed:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: 'bg-amber-500',
      completed: 'bg-green-500',
      overdue: 'bg-red-500',
      cancelled: 'bg-slate-500'
    };
    return <Badge className={statusMap[status as keyof typeof statusMap] || 'bg-slate-500'}>{status}</Badge>;
  };

  return (
    <Card className="border-amber-200 bg-amber-50">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-amber-100 transition-colors">
            <CardTitle className="flex items-center gap-2 text-sm">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <Bug className="h-4 w-4" />
              Payment Debug Panel - Agreement {agreement.agreement_number}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRunDiagnostics}
                  disabled={isPending.fix}
                  className="text-xs"
                >
                  {isPending.fix ? 'Running...' : 'Run Diagnostics'}
                </Button>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b">
                <button
                  className={`px-3 py-2 text-xs font-medium ${activeTab === 'schedule' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-600'}`}
                  onClick={() => setActiveTab('schedule')}
                >
                  <Calendar className="h-3 w-3 inline mr-1" />
                  Schedule ({paymentSchedule.length})
                </button>
                <button
                  className={`px-3 py-2 text-xs font-medium ${activeTab === 'payments' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-600'}`}
                  onClick={() => setActiveTab('payments')}
                >
                  <Database className="h-3 w-3 inline mr-1" />
                  Payments ({payments.length})
                </button>
                <button
                  className={`px-3 py-2 text-xs font-medium ${activeTab === 'sync' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-slate-600'}`}
                  onClick={() => setActiveTab('sync')}
                >
                  Sync Results
                </button>
              </div>

              {/* Tab Content */}
              <div className="text-xs">
                {activeTab === 'schedule' && (
                  <div className="space-y-2">
                    <div className="font-medium">Payment Schedule ({paymentSchedule.length} items)</div>
                    {isLoadingSchedule ? (
                      <div>Loading schedule...</div>
                    ) : scheduleError ? (
                      <div className="text-red-600">Error: {scheduleError.toString()}</div>
                    ) : paymentSchedule.length === 0 ? (
                      <div className="text-amber-600 p-2 bg-amber-100 rounded">⚠️ No payment schedule found</div>
                    ) : (
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {paymentSchedule.slice(0, 5).map((item, index) => (
                          <div key={item.id || index} className="flex justify-between items-center p-1 bg-white rounded text-xs">
                            <span>{formatDate(new Date(item.due_date), 'MMM d, yyyy')}</span>
                            <span>${item.amount}</span>
                            {getStatusBadge(item.status)}
                          </div>
                        ))}
                        {paymentSchedule.length > 5 && (
                          <div className="text-slate-500">... and {paymentSchedule.length - 5} more</div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'payments' && (
                  <div className="space-y-2">
                    <div className="font-medium">Actual Payments ({payments.length} records)</div>
                    {isLoadingPayments ? (
                      <div>Loading payments...</div>
                    ) : paymentsError ? (
                      <div className="text-red-600">Error: {paymentsError.toString()}</div>
                    ) : payments.length === 0 ? (
                      <div className="text-amber-600 p-2 bg-amber-100 rounded">⚠️ No payments found</div>
                    ) : (
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {payments.slice(0, 5).map((payment) => (
                          <div key={payment.id} className="flex justify-between items-center p-1 bg-white rounded text-xs">
                            <span>{formatDate(new Date(payment.payment_date || payment.created_at || ''), 'MMM d, yyyy')}</span>
                            <span>${payment.amount}</span>
                            {getStatusBadge(payment.status || '')}
                          </div>
                        ))}
                        {payments.length > 5 && (
                          <div className="text-slate-500">... and {payments.length - 5} more</div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'sync' && (
                  <div className="space-y-2">
                    <div className="font-medium">Sync Results</div>
                    {syncResults ? (
                      <div className="p-2 bg-white rounded space-y-1">
                        <div>Agreement ID: {syncResults.agreementId}</div>
                        <div>Sync Completed: {syncResults.syncCompleted ? '✅' : '❌'}</div>
                        <div>Schedule Exists: {syncResults.scheduleExists ? '✅' : '❌'}</div>
                        <div>Schedule Items: {syncResults.scheduleItems || 0}</div>
                      </div>
                    ) : (
                      <div className="text-slate-500">No sync results yet. Run diagnostics to see results.</div>
                    )}
                  </div>
                )}
              </div>

              {/* Agreement Info */}
              <div className="text-xs text-slate-600 border-t pt-2">
                <div>Status: {agreement.status}</div>
                <div>Payment Frequency: {agreement.payment_frequency || 'Not set'}</div>
                <div>Payment Day: {agreement.payment_day || agreement.rent_due_day || 'Not set'}</div>
                <div>Rent Amount: ${agreement.rent_amount || 'Not set'}</div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
