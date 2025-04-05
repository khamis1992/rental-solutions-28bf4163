
import { AlertCircle } from 'lucide-react';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';
import { getDirectionalTextAlign } from '@/utils/rtl-utils';

export const EmptyPaymentState = () => {
  const { t } = useI18nTranslation();
  const { isRTL } = useTranslation();
  
  return (
    <div className={`flex flex-col items-center justify-center py-8 text-center text-muted-foreground ${isRTL ? 'rtl' : ''}`}>
      <AlertCircle className="mb-2 h-10 w-10" />
      <h3 className="text-lg font-medium">{t('agreements.noPayments')}</h3>
      <p className="mt-1">{t('agreements.noPaymentsDesc')}</p>
    </div>
  );
};
