
import React from 'react';
import { useTranslationContext } from '@/contexts/TranslationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageContainer from '@/components/layout/PageContainer';
import { useTranslation } from 'react-i18next';
import { dirAwareTextAlign } from '@/utils/rtl-utils';

const SystemSettings: React.FC = () => {
  const { t } = useTranslation();
  const { currentLanguage, setLanguage, isRTL, loading } = useTranslationContext();

  const handleLanguageChange = (value: string) => {
    setLanguage(value as 'en' | 'ar' | 'fr' | 'es');
  };

  return (
    <PageContainer 
      title={t('settings.systemSettings')} 
      subtitle={t('settings.systemSettingsDescription')}
    >
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className={dirAwareTextAlign(currentLanguage)}>
              {t('settings.languageSettings')}
            </CardTitle>
            <CardDescription className={dirAwareTextAlign(currentLanguage)}>
              {t('settings.languageSettingsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="language" className={`${dirAwareTextAlign(currentLanguage)} col-span-1`}>
                  {t('settings.language')}
                </Label>
                <div className="col-span-3">
                  <Select
                    value={currentLanguage}
                    onValueChange={handleLanguageChange}
                    disabled={loading}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder={t('settings.selectLanguage')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">العربية (Arabic)</SelectItem>
                      <SelectItem value="fr">Français (French)</SelectItem>
                      <SelectItem value="es">Español (Spanish)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button disabled={loading} variant="outline" onClick={() => console.log('Testing translation system')}>
                  {t('common.testTranslation')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={dirAwareTextAlign(currentLanguage)}>
              {t('settings.translationDebug')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 rounded-md bg-slate-50 p-4 dark:bg-slate-900">
              <p className={dirAwareTextAlign(currentLanguage)}>
                <strong>{t('settings.currentLanguage')}:</strong> {currentLanguage}
              </p>
              <p className={dirAwareTextAlign(currentLanguage)}>
                <strong>{t('settings.rtlMode')}:</strong> {isRTL ? t('common.enabled') : t('common.disabled')}
              </p>
              <p className={dirAwareTextAlign(currentLanguage)}>
                <strong>{t('settings.documentDirection')}:</strong> {document.documentElement.dir}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default SystemSettings;
