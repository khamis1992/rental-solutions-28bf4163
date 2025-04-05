
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/date-utils';
import { useAgreements } from '@/hooks/use-agreements';
import React from 'react';

interface AgreementHistorySectionProps {
  customerId: string;
}

// Memoizing the TableRow component for better performance
const AgreementTableRow = React.memo(({ agreement, t }) => {
  // Memoize the badge variant calculation
  const badgeVariant = useMemo(() => {
    return agreement.status === 'ACTIVE' ? 'success' :
      agreement.status === 'PENDING' ? 'warning' :
      agreement.status === 'CANCELLED' ? 'destructive' :
      agreement.status === 'CLOSED' ? 'outline' :
      agreement.status === 'EXPIRED' ? 'secondary' :
      'default';
  }, [agreement.status]);

  return (
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
          variant={badgeVariant}
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
  );
});

// Using React.memo to avoid re-rendering when props haven't changed
export const AgreementHistorySection = React.memo(({ customerId }: AgreementHistorySectionProps) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const pageSize = 5;
  
  // Use optimized column selection in useAgreements hook
  const { agreements, isLoading: isLoadingAgreements } = useAgreements({ 
    customerId,
    page,
    pageSize,
    columns: 'id,agreement_number,vehicle(make,model,license_plate),start_date,end_date,status,total_amount'
  });
  
  // Memoize the empty state message
  const emptyStateMessage = useMemo(() => (
    <TableRow>
      <TableCell colSpan={7} className="h-24 text-center">
        {t('agreements.noAgreements')}
      </TableCell>
    </TableRow>
  ), [t]);

  // Memoize the loading skeleton
  const loadingSkeletons = useMemo(() => (
    Array.from({ length: 3 }).map((_, i) => (
      <TableRow key={`skeleton-${i}`}>
        {Array.from({ length: 7 }).map((_, j) => (
          <TableCell key={`skeleton-cell-${i}-${j}`}>
            <Skeleton className="h-6 w-full" />
          </TableCell>
        ))}
      </TableRow>
    ))
  ), []);

  // Memoize the button state calculations
  const isPreviousDisabled = useMemo(() => page === 1, [page]);
  const isNextDisabled = useMemo(() => {
    return !agreements || agreements.length < pageSize;
  }, [agreements, pageSize]);
  
  return (
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
            {isLoadingAgreements ? loadingSkeletons : 
              (agreements && agreements.length > 0) ? 
                agreements.map((agreement) => (
                  <AgreementTableRow 
                    key={agreement.id} 
                    agreement={agreement} 
                    t={t} 
                  />
                )) : emptyStateMessage}
          </TableBody>
        </Table>
      </div>
      
      {agreements && agreements.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={isPreviousDisabled}
          >
            {t('common.previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('common.page')} {page}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPage(p => p + 1)}
            disabled={isNextDisabled}
          >
            {t('common.next')}
          </Button>
        </div>
      )}
    </CardContent>
  );
});

// Add display name for React DevTools
AgreementHistorySection.displayName = 'AgreementHistorySection';
