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
import { Settings, Save, Bell, Shield, CreditCard, Globe, Mail, Wrench, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { IdConverterTool } from '@/components/settings/IdConverterTool';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getSystemServicesStatus } from '@/utils/service-availability';
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useTranslation } from '@/contexts/TranslationContext';
import LanguageSelector from '@/components/settings/LanguageSelector';
import { useDirectionalClasses } from '@/utils/rtl-utils';

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
  const { t } = useI18nTranslation();
  const { language, direction } = useTranslation();
  const [serviceStatus, setServiceStatus] = useState({
    agreementImport: true,
    customerImport: true,
    isChecking: true
  });
  const [testTranslationInput, setTestTranslationInput] = useState('');
  const [testTranslationResult, setTestTranslationResult] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const { translateText: translate } = useTranslation();

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
    language: language,
    currency: 'USD',
    date_format: 'MM/DD/YYYY',
    time_zone: 'UTC',
  });

  React.useEffect(() => {
    if (settings) {
      setFormData(prevData => ({
        ...prevData,
        ...settings,
      }));
    }
  }, [settings]);

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
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
      console.error("Error saving settings:", error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettingsMutation.mutate(formData);
  };

  const handleTestTranslation = async () => {
    if (!testTranslationInput.trim()) return;
    
    try {
      setIsTranslating(true);
      const translated = await translate(testTranslationInput, language === 'en' ? 'ar' : 'en');
      setTestTranslationResult(translated);
    } catch (error) {
      console.error('Translation test error:', error);
      toast({
        title: "Translation Failed",
        description: "An error occurred during translation.",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer 
        title={t('settings.title')} 
        description={t('settings.description')}
      >
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Loading settings...</h2>
          </div>
        </div>
      </PageContainer>
    );
  }

  const gridClasses = useDirectionalClasses(
    "grid grid-cols-1 md:grid-cols-2 gap-6",
    "",
    "md:[direction:rtl]"
  );

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
            <span className="font-semibold">System Service Limitations</span>
            {!serviceStatus.agreementImport && (
              <span>• Agreement import function is unavailable</span>
            )}
            {!serviceStatus.customerImport && (
              <span>• Customer import function is unavailable</span>
            )}
            <span className="text-sm mt-1">Some system features may not work properly. Please contact system administrator.</span>
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
                  <h3 className="text-lg font-medium mb-4">{t('settings.companyInformation')}</h3>
                  <div className={gridClasses}>
                    <div className="space-y-2">
                      <Label htmlFor="company_name">{t('settings.companyName')}</Label>
                      <Input 
                        id="company_name"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleInputChange}
                        placeholder={t('settings.companyName')}
                        dir={direction}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="business_email">{t('settings.businessEmail')}</Label>
                      <Input 
                        id="business_email"
                        name="business_email"
                        value={formData.business_email}
                        onChange={handleInputChange}
                        placeholder={t('settings.businessEmail')}
                        dir={direction}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('settings.phoneNumber')}</Label>
                      <Input 
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder={t('settings.phoneNumber')}
                        dir={direction}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">{t('settings.businessAddress')}</Label>
                      <Input 
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder={t('settings.businessAddress')}
                        dir={direction}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="logo_url">{t('settings.logoUrl')}</Label>
                      <Input 
                        id="logo_url"
                        name="logo_url"
                        value={formData.logo_url}
                        onChange={handleInputChange}
                        placeholder={t('settings.logoUrl')}
                        dir={direction}
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
                        <p className="text-sm text-muted-foreground">{t('settings.enableAutomaticUpdates')}</p>
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
                        <p className="text-sm text-muted-foreground">{t('settings.enableDarkMode')}</p>
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
                  <h3 className="text-lg font-medium mb-4">{t('settings.notificationsPreferences')}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="notification_emails" className="font-medium">{t('settings.emailNotifications')}</Label>
                        <p className="text-sm text-muted-foreground">{t('settings.receiveEmailNotifications')}</p>
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
                        <p className="text-sm text-muted-foreground">{t('settings.receiveSystemNotifications')}</p>
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
                        <p className="text-sm text-muted-foreground">{t('settings.receiveReportNotifications')}</p>
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
                  <h3 className="text-lg font-medium mb-4">{t('settings.securitySettings')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Security settings are managed through Supabase authentication. Visit the Supabase dashboard to configure advanced security settings.
                  </p>
                  
                  <Button variant="outline" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Open Security Dashboard</span>
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="localization" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('settings.localization')}</h3>
                  <div className={gridClasses}>
                    <div className="space-y-2">
                      <Label htmlFor="language">{t('settings.language')}</Label>
                      <LanguageSelector 
                        onValueChange={(value) => handleSelectChange('language', value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="currency">{t('settings.currency')}</Label>
                      <Select 
                        value={formData.currency} 
                        onValueChange={(value) => handleSelectChange('currency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('settings.currency')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">US Dollar ($)</SelectItem>
                          <SelectItem value="EUR">Euro (€)</SelectItem>
                          <SelectItem value="GBP">British Pound (£)</SelectItem>
                          <SelectItem value="AED">UAE Dirham (د.إ)</SelectItem>
                          <SelectItem value="SAR">Saudi Riyal (ر.س)</SelectItem>
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
                          <SelectValue placeholder={t('settings.dateFormat')} />
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
                          <SelectValue placeholder={t('settings.timeZone')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                          <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                          <SelectItem value="Asia/Riyadh">Riyadh (AST)</SelectItem>
                          <SelectItem value="Asia/Qatar">Qatar (AST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2 border p-4 rounded-md bg-gray-50">
                      <h4 className="font-semibold mb-4">Translation Test Tool</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="test-translation">{t('settings.testTranslation')}</Label>
                          <div className="flex gap-2">
                            <Input
                              id="test-translation"
                              value={testTranslationInput}
                              onChange={(e) => setTestTranslationInput(e.target.value)}
                              placeholder="Enter text to translate"
                              className="flex-1"
                            />
                            <Button 
                              type="button" 
                              variant="secondary" 
                              onClick={handleTestTranslation}
                              disabled={isTranslating || !testTranslationInput.trim()}
                            >
                              {isTranslating ? 'Translating...' : `Translate to ${language === 'en' ? 'Arabic' : 'English'}`}
                            </Button>
                          </div>
                        </div>
                        
                        {testTranslationResult && (
                          <div className="bg-white p-3 border rounded-md">
                            <p className="text-sm font-medium">Translation Result:</p>
                            <p className={language === 'ar' ? 'font-mono' : language === 'en' ? 'font-mono text-right' : ''}>
                              {testTranslationResult}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 col-span-2 border p-4 rounded-md bg-gray-50">
                      <h4 className="font-semibold">Translation Debug Info</h4>
                      <div className="text-sm">
                        <p>Current Language: <span className="font-mono">{language}</span></p>
                        <p>Current Direction: <span className="font-mono">{direction}</span></p>
                        <p>HTML dir attribute: <span className="font-mono">{document.documentElement.dir}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="tools" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('settings.tools')}</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Specialized tools to help with system operations and data management.
                  </p>
                  
                  {(!serviceStatus.agreementImport || !serviceStatus.customerImport) && (
                    <Alert variant="warning" className="mb-6">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Some tools may have limited functionality due to unavailable import services.
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
                    Configure third-party service integrations to extend the functionality of your system.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Payment Gateway</CardTitle>
                          <CreditCard className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <CardDescription>Configure payment gateway settings</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" size="sm" className="w-full">Configure</Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Email Provider</CardTitle>
                          <Mail className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <CardDescription>Configure email provider settings</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" size="sm" className="w-full">Configure</Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Maps API</CardTitle>
                          <Globe className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <CardDescription>Configure maps API settings</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" size="sm" className="w-full">Configure</Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Card>
          
          <div className={useDirectionalClasses("flex justify-end", "", "flex justify-start")}>
            <Button 
              type="submit" 
              className="flex items-center gap-2"
              disabled={saveSettingsMutation.isPending}
            >
              <Save className="h-4 w-4" />
              {saveSettingsMutation.isPending ? t('settings.saving') : t('settings.saveSettings')}
            </Button>
          </div>
        </Tabs>
      </form>
    </PageContainer>
  );
};

export default SystemSettings;
