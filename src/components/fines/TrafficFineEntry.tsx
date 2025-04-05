
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { useTranslation } from 'react-i18next';
import { useTranslation as useAppTranslation } from '@/contexts/TranslationContext';
import { toast } from 'sonner';

interface TrafficFineEntryProps {
  onFineSaved: () => void;
}

const TrafficFineEntry = ({ onFineSaved }: TrafficFineEntryProps) => {
  const { t } = useTranslation();
  const { isRTL } = useAppTranslation();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [violationDate, setViolationDate] = useState<Date | undefined>(new Date());

  const onSubmit = (data: any) => {
    // Submit logic would go here
    toast.success(t('trafficFines.fineRecorded', 'Traffic fine recorded successfully'));
    onFineSaved();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('trafficFines.recordFine')}</CardTitle>
        <CardDescription>{t('trafficFines.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="violationNumber" className="block text-sm font-medium">
                {t('trafficFines.violationNumber')}
              </label>
              <Input 
                id="violationNumber" 
                placeholder={t('trafficFines.violationNumberPlaceholder')} 
                {...register('violationNumber', { required: true })}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="licensePlate" className="block text-sm font-medium">
                {t('common.licensePlate')}
              </label>
              <Input 
                id="licensePlate" 
                placeholder={t('trafficFines.licensePlatePlaceholder')} 
                {...register('licensePlate', { required: true })}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="violationDate" className="block text-sm font-medium">
                {t('trafficFines.violationDate')}
              </label>
              <DatePicker
                date={violationDate}
                setDate={setViolationDate}
                disabled={false}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="fineAmount" className="block text-sm font-medium">
                {t('trafficFines.fineAmount')}
              </label>
              <Input 
                id="fineAmount" 
                type="number" 
                placeholder={t('trafficFines.fineAmountPlaceholder')} 
                {...register('fineAmount', { required: true, min: 0 })}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="violationCharge" className="block text-sm font-medium">
                {t('trafficFines.violationCharge')}
              </label>
              <Input 
                id="violationCharge" 
                placeholder={t('trafficFines.violationChargePlaceholder')} 
                {...register('violationCharge')}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="paymentStatus" className="block text-sm font-medium">
                {t('trafficFines.paymentStatus')}
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t('trafficFines.selectPaymentStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t('trafficFines.status.pending')}</SelectItem>
                  <SelectItem value="paid">{t('trafficFines.status.paid')}</SelectItem>
                  <SelectItem value="disputed">{t('trafficFines.status.disputed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="location" className="block text-sm font-medium">
                {t('trafficFines.location')}
              </label>
              <Input 
                id="location" 
                placeholder={t('trafficFines.locationPlaceholder')} 
                {...register('location')}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium">
                {t('common.notes')}
              </label>
              <Textarea 
                id="notes" 
                placeholder={t('common.description')} 
                {...register('notes')}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onFineSaved}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {t('common.submit')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TrafficFineEntry;
