
import React, { useState, useEffect } from 'react';
import { useTrafficFines } from '@/hooks/use-traffic-fines';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';
import { useDateFormatter } from '@/lib/date-utils';

interface AgreementTrafficFinesProps {
  agreementId: string;
  startDate: Date;
  endDate: Date;
}

export function AgreementTrafficFines({ agreementId, startDate, endDate }: AgreementTrafficFinesProps) {
  const { t } = useI18nTranslation();
  const { isRTL } = useTranslation();
  const { formatDate } = useDateFormatter();
  const { isLoading, trafficFines } = useTrafficFines();
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    // Initial loading state is managed by the hook
    setShowLoader(isLoading);
  }, [isLoading]);

  const handleRefresh = async () => {
    setShowLoader(true);
    // Wait a moment for visual feedback
    setTimeout(() => {
      setShowLoader(false);
    }, 1000);
  };

  if (isLoading || showLoader) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Filter traffic fines for this agreement if needed
  const filteredFines = trafficFines ? trafficFines.filter(fine => 
    fine.leaseId === agreementId
  ) : [];

  if (!filteredFines || filteredFines.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-center py-4 text-muted-foreground">
          {t("trafficFines.noFines")}
        </p>
        <div className="flex justify-center">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            {t("trafficFines.checkNew")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className={`w-full text-sm ${isRTL ? 'text-right' : 'text-left'}`}>
          <thead>
            <tr className="border-b">
              <th className={`py-3 px-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t("common.date")}</th>
              <th className={`py-3 px-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t("trafficFines.location")}</th>
              <th className={`py-3 px-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t("trafficFines.violationNumber")}</th>
              <th className={`py-3 px-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t("common.amount")}</th>
              <th className={`py-3 px-4 ${isRTL ? 'text-right' : 'text-left'}`}>{t("common.status")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredFines.map((fine) => (
              <tr key={fine.id} className="border-b hover:bg-muted/50">
                <td className="py-3 px-4">
                  {fine.violationDate 
                    ? formatDate(new Date(fine.violationDate))
                    : t("common.notProvided")}
                </td>
                <td className="py-3 px-4">{fine.location || t("common.notProvided")}</td>
                <td className="py-3 px-4">{fine.violationCharge || t("common.notProvided")}</td>
                <td className="py-3 px-4 text-right">
                  {fine.fineAmount 
                    ? `QAR ${fine.fineAmount.toLocaleString()}` 
                    : t("common.notProvided")}
                </td>
                <td className="py-3 px-4 text-right">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    fine.paymentStatus === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {fine.paymentStatus === 'paid' 
                      ? t("trafficFines.status.paid") 
                      : t("trafficFines.status.pending")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className={`flex justify-between items-center pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <p className="text-sm text-muted-foreground">
            {t("common.showing", { count: filteredFines.length })}
          </p>
        </div>
        
        <Button onClick={handleRefresh} variant="outline" size="sm">
          {t("common.refresh")}
        </Button>
      </div>
    </div>
  );
}
