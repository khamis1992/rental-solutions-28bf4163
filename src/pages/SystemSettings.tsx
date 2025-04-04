
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/contexts/TranslationContext';
import LanguageSelector from '@/components/settings/LanguageSelector';

const SystemSettings: React.FC = () => {
  const { t, direction } = useTranslation();
  
  return (
    <div className="p-6" dir={direction}>
      <h1 className="text-2xl font-bold mb-6">{t('settings.systemSettings')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.languageSettings')}</CardTitle>
          </CardHeader>
          <CardContent>
            <LanguageSelector />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemSettings;
