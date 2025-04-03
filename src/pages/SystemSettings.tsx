
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import PageContainer from '@/components/layout/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SectionHeader } from '@/components/ui/section-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Save, Building, Bell, Shield, CreditCard, Globe, Mail, Wrench, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { IdConverterTool } from '@/components/settings/IdConverterTool';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getSystemServicesStatus } from '@/utils/service-availability';
import { useTranslation } from 'react-i18next';
import { useTranslationContext } from '@/contexts/TranslationContext';

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  created_at: string;
  updated_at: string;
}

const SystemSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [serviceStatus, setServiceStatus] = useState({
    agreementImport: true,
    customerImport: true,
    isChecking: true
  });
  
  const { t } = useTranslation();
  const { currentLanguage, setLanguage, isRTL } = useTranslationContext();
  
  useEffect(() => {
    const checkServices = async () => {
      try {
        setServiceStatus(prev => ({ ...prev, isChecking: true }));
        
        const status = await getSystemServicesStatus();
        
        setServiceStatus({
          ...status,
          isChecking: false
        });
      } catch (err) {
        console.error("Error checking service availability:", err);
        setServiceStatus({
          agreementImport: false,
          customerImport: false,
          isChecking: false
        });
      }
    };
    
    checkServices();
  }, []);
  
  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
        
      if (error) {
        throw new Error(error.message);
      }
      
      const settingsObj: Record<string, any> = {};
      data.forEach((setting: SystemSetting) => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });
      
      return settingsObj;
    }
  });
  
  const [formData, setFormData] = useState({
    company_name: '',
    business_email: '',
    phone: '',
    address: '',
    logo_url: '',
    automatic_updates: true,
    dark_mode: false,
    notification_emails: true,
    notification_system: true,
    notification_reports: true,
    language: 'english',
    currency: 'USD',
    date_format: 'MM/DD/YYYY',
    time_zone: 'UTC',
    default_language: 'en',
  });
  
  React.useEffect(() => {
    if (settings) {
      setFormData(prevData => ({
        ...prevData,
        ...settings,
        default_language: settings.default_language || currentLanguage || 'en',
      }));
    }
  }, [settings, currentLanguage]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // If changing the default language, also update the current language
    if (name === 'default_language') {
      setLanguage(value as any);
    }
  };
  
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: Record<string, any>) => {
      const operations = Object.entries(newSettings).map(([key, value]) => {
        return supabase
          .from('system_settings')
          .upsert({ 
            setting_key: key, 
            setting_value: value 
          }, {
            onConflict: 'setting_key'
          });
      });
      
      await Promise.all(operations);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast({
        title: t('settings.saveSettings'),
        description: t('settings.saveSuccess'),
      });
    },
    onError: (error) => {
      toast({
        title: t('errors.error'),
        description: t('settings.saveError'),
        variant: "destructive",
      });
      console.error("Error saving settings:", error);
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettingsMutation.mutate(formData);
  };
  
  if (isLoading) {
    return (
      <PageContainer 
        title={t('settings.title')}
        description={t('settings.description')}
      >
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">{t('common.loading')}</h2>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      title={t('settings.title')}
      description={t('settings.description')}
    >
      <div className="flex items-center mb-6">
        <SectionHeader 
          title={t('settings.title')}
          description={t('settings.description')}
          icon={Settings} 
        />
      </div>
      
      {(!serviceStatus.agreementImport || !serviceStatus.customerImport) && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex flex-col gap-1">
            <span className="font-semibold">{t('settings.serviceStatus')}</span>
            {!serviceStatus.agreementImport && (
              <span>• {t('settings.agreementImportUnavailable')}</span>
            )}
            {!serviceStatus.customerImport && (
              <span>• {t('settings.customerImportUnavailable')}</span>
            )}
            <span className="text-sm mt-1">{t('settings.contactAdmin')}</span>
          </AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-6 mb-8 w-full max-w-4xl">
            <TabsTrigger value="general">{t('settings.general')}</TabsTrigger>
            <TabsTrigger value="notifications">{t('settings.notifications')}</TabsTrigger>
            <TabsTrigger value="security">{t('settings.security')}</TabsTrigger>
            <TabsTrigger value="localization">{t('settings.localization')}</TabsTrigger>
            <TabsTrigger value="tools">{t('settings.tools')}</TabsTrigger>
            <TabsTrigger value="integrations">{t('settings.integrations')}</TabsTrigger>
          </TabsList>
          
          <Card className="mb-6">
            <CardContent className="pt-6">
              <TabsContent value="general" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('settings.companyInfo')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">{t('settings.companyName')}</Label>
                      <Input 
                        id="company_name"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleInputChange}
                        placeholder={t('settings.companyNamePlaceholder')}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="business_email">{t('settings.businessEmail')}</Label>
                      <Input 
                        id="business_email"
                        name="business_email"
                        value={formData.business_email}
                        onChange={handleInputChange}
                        placeholder={t('settings.businessEmailPlaceholder')}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('settings.phone')}</Label>
                      <Input 
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder={t('settings.phonePlaceholder')}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">{t('settings.address')}</Label>
                      <Input 
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder={t('settings.addressPlaceholder')}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="logo_url">{t('settings.logoUrl')}</Label>
                      <Input 
                        id="logo_url"
                        name="logo_url"
                        value={formData.logo_url}
                        onChange={handleInputChange}
                        placeholder={t('settings.logoUrlPlaceholder')}
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('settings.systemPreferences')}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="automatic_updates" className="font-medium">{t('settings.automaticUpdates')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings.automaticUpdatesDescription')}</p>
                      </div>
                      <Switch 
                        id="automatic_updates" 
                        checked={formData.automatic_updates}
                        onCheckedChange={(checked) => handleSwitchChange('automatic_updates', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="dark_mode" className="font-medium">{t('settings.darkMode')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings.darkModeDescription')}</p>
                      </div>
                      <Switch 
                        id="dark_mode" 
                        checked={formData.dark_mode}
                        onCheckedChange={(checked) => handleSwitchChange('dark_mode', checked)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="notifications" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('settings.notificationPreferences')}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="notification_emails" className="font-medium">{t('settings.emailNotifications')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings.emailNotificationsDescription')}</p>
                      </div>
                      <Switch 
                        id="notification_emails" 
                        checked={formData.notification_emails}
                        onCheckedChange={(checked) => handleSwitchChange('notification_emails', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="notification_system" className="font-medium">{t('settings.systemNotifications')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings.systemNotificationsDescription')}</p>
                      </div>
                      <Switch 
                        id="notification_system" 
                        checked={formData.notification_system}
                        onCheckedChange={(checked) => handleSwitchChange('notification_system', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="notification_reports" className="font-medium">{t('settings.reportNotifications')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings.reportNotificationsDescription')}</p>
                      </div>
                      <Switch 
                        id="notification_reports" 
                        checked={formData.notification_reports}
                        onCheckedChange={(checked) => handleSwitchChange('notification_reports', checked)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="security" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('settings.security')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('settings.securityDescription')}
                  </p>
                  
                  <Button variant="outline" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>{t('settings.openSecurityDashboard')}</span>
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="localization" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('settings.localization')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="default_language">{t('settings.defaultLanguage')}</Label>
                      <Select 
                        value={formData.default_language} 
                        onValueChange={(value) => handleSelectChange('default_language', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('settings.selectLanguage')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">{t('languages.en')}</SelectItem>
                          <SelectItem value="ar">{t('languages.ar')}</SelectItem>
                          <SelectItem value="fr">{t('languages.fr')}</SelectItem>
                          <SelectItem value="es">{t('languages.es')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="currency">{t('settings.currency')}</Label>
                      <Select 
                        value={formData.currency} 
                        onValueChange={(value) => handleSelectChange('currency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('settings.selectCurrency')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">US Dollar ($)</SelectItem>
                          <SelectItem value="EUR">Euro (€)</SelectItem>
                          <SelectItem value="GBP">British Pound (£)</SelectItem>
                          <SelectItem value="AED">UAE Dirham (د.إ)</SelectItem>
                          <SelectItem value="QAR">Qatari Riyal (ر.ق)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="date_format">{t('settings.dateFormat')}</Label>
                      <Select 
                        value={formData.date_format} 
                        onValueChange={(value) => handleSelectChange('date_format', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('settings.selectDateFormat')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="time_zone">{t('settings.timeZone')}</Label>
                      <Select 
                        value={formData.time_zone} 
                        onValueChange={(value) => handleSelectChange('time_zone', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('settings.selectTimeZone')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                          <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                          <SelectItem value="Asia/Qatar">Qatar (AST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="tools" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('settings.tools')}</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {t('settings.toolsDescription')}
                  </p>
                  
                  {(!serviceStatus.agreementImport || !serviceStatus.customerImport) && (
                    <Alert variant="warning" className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {t('settings.toolsLimitedFunctionality')}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <IdConverterTool />
                </div>
              </TabsContent>
              
              <TabsContent value="integrations" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('settings.integrations')}</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {t('settings.integrationsDescription')}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{t('settings.paymentGateway')}</CardTitle>
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <CardDescription>{t('settings.paymentGatewayDescription')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" size="sm" className="w-full">{t('settings.configure')}</Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{t('settings.emailProvider')}</CardTitle>
                          <Mail className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <CardDescription>{t('settings.emailProviderDescription')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" size="sm" className="w-full">{t('settings.configure')}</Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{t('settings.mapsAPI')}</CardTitle>
                          <Globe className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <CardDescription>{t('settings.mapsAPIDescription')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" size="sm" className="w-full">{t('settings.configure')}</Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              className="flex items-center gap-2"
              disabled={saveSettingsMutation.isPending}
            >
              <Save className="h-4 w-4" />
              {saveSettingsMutation.isPending ? t('common.saving') : t('settings.saveSettings')}
            </Button>
          </div>
        </Tabs>
      </form>
    </PageContainer>
  );
};

export default SystemSettings;
