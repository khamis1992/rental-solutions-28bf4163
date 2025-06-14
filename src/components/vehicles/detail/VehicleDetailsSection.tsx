import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DetailItemProps {
  label: string;
  value: string | number | React.ReactNode;
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value }) => {
  const { language } = useLanguage();
  
  return (
    <div className={`space-y-1 ${language === 'ar' ? 'text-right' : ''}`}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-base">{value}</p>
    </div>
  );
};

interface VehicleDetailsSectionProps {
  details: {
    label: string;
    value: string | number | React.ReactNode;
  }[];
  inspection_expiry?: string;
  onEditInspectionExpiry?: (date: string) => void;
}

export const VehicleDetailsSection: React.FC<VehicleDetailsSectionProps> = ({ 
  details,
  inspection_expiry,
  onEditInspectionExpiry
}) => {
  const { language } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(inspection_expiry);

  const handleSave = () => {
    if (selectedDate && onEditInspectionExpiry) {
      onEditInspectionExpiry(selectedDate);
      setEditing(false);
    }
  };

  return (
    <>
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${language === 'ar' ? 'text-right' : ''}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {details.map((detail, index) => {
          if (detail.label === (language === 'ar' ? 'انتهاء الفحص' : 'Inspection Expiry')) {
            return (
              <div key={index} className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <DetailItem label={detail.label} value={
                  editing ? (
                    <>
                      <input
                        type="date"
                        value={selectedDate ? selectedDate.substring(0, 10) : ''}
                        onChange={e => setSelectedDate(e.target.value)}
                        className={`border rounded px-2 py-1 ${language === 'ar' ? 'text-right' : ''}`}
                      />
                      <button className={`text-blue-600 ${language === 'ar' ? 'mr-2' : 'ml-2'}`} onClick={handleSave}>
                        {language === 'ar' ? 'حفظ' : 'Save'}
                      </button>
                      <button className={`text-gray-500 ${language === 'ar' ? 'mr-1' : 'ml-1'}`} onClick={() => setEditing(false)}>
                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                      </button>
                    </>
                  ) : (
                    <>
                      {detail.value}
                      <button className={`text-blue-600 underline text-xs ${language === 'ar' ? 'mr-2' : 'ml-2'}`} onClick={() => setEditing(true)}>
                        {language === 'ar' ? 'تحرير' : 'Edit'}
                      </button>
                    </>
                  )
                } />
              </div>
            );
          }
          return <DetailItem key={index} label={detail.label} value={detail.value} />;
        })}
      </div>
    </>
  );
};
