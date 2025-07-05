
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/ui/PageHeader';
import { HijriDateConverter } from '@/components/ui/hijri-date-converter';
import { Calendar } from 'lucide-react';

const HijriDateConverterPage = () => {
  return (
    <PageContainer systemDate={new Date()}>
      <PageHeader
        title="محول التاريخ الهجري والميلادي"
        subtitle="تحويل التواريخ بين التقويم الهجري والميلادي"
        icon={<Calendar className="w-6 h-6 text-blue-500" />}
        align="right"
        dir="rtl"
      />
      
      <div className="mt-6">
        <HijriDateConverter 
          initialHijriDate="1441/01/16"
          onConvert={(hijriDate, gregorianDate) => {
            console.log('Converted:', { hijriDate, gregorianDate });
          }}
        />
      </div>
    </PageContainer>
  );
};

export default HijriDateConverterPage;
