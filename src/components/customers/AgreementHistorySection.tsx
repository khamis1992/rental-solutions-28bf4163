
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/date-utils';
import { useAgreements } from '@/hooks/use-agreements';

interface AgreementHistorySectionProps {
  customerId: string;
}

export function AgreementHistorySection({ customerId }: AgreementHistorySectionProps) {
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
      
      {agreements && agreements.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
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
            disabled={agreements.length < pageSize}
          >
            {t('common.next')}
          </Button>
        </div>
      )}
    </CardContent>
  );
}
