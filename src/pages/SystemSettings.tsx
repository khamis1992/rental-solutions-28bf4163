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

// Type for system settings
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
  
  // Check edge function availability
  useEffect(() => {
    const checkFunctionAvailability = async () => {
      try {
        setServiceStatus(prev => ({ ...prev, isChecking: true }));
        
        // Check agreement import function
        const agreementCheck = await supabase.functions.invoke('process-agreement-imports', {
          body: { test: true },
        });
        
        // Check customer import function
        const customerCheck = await supabase.functions.invoke('process-customer-imports', {
          body: { test: true },
        });
        
        setServiceStatus({
          agreementImport: !agreementCheck.error,
          customerImport: !customerCheck.error,
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
    
    checkFunctionAvailability();
  }, []);
  
  // Fetch system settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');
        
      if (error) {
        throw new Error(error.message);
      }
      
      // Convert array to an object for easier access
      const settingsObj: Record<string, any> = {};
      data.forEach((setting: SystemSetting) => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });
      
      return settingsObj;
    }
  });
  
  // Form state
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
  });
  
  // Update form data when settings are loaded
  React.useEffect(() => {
    if (settings) {
      setFormData(prevData => ({
        ...prevData,
        ...settings,
      }));
    }
  }, [settings]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle switch changes
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Save settings mutation
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
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettingsMutation.mutate(formData);
  };
  
  if (isLoading) {
    return (
      <PageContainer 
        title="System Settings" 
        description="Configure your system settings"
      >
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Loading settings...</h2>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer 
      title="System Settings" 
      description="Configure your system settings"
    >
      <div className="flex items-center mb-6">
        <SectionHeader 
          title="System Settings" 
          description="Configure your system-wide settings and preferences" 
          icon={Settings} 
        />
      </div>
      
      {/* System Status Alert */}
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
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="localization">Localization</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>
          
          <Card className="mb-6">
            <CardContent className="pt-6">
              <TabsContent value="general" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Company Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Company Name</Label>
                      <Input 
                        id="company_name"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleInputChange}
                        placeholder="Enter company name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="business_email">Business Email</Label>
                      <Input 
                        id="business_email"
                        name="business_email"
                        value={formData.business_email}
                        onChange={handleInputChange}
                        placeholder="Enter business email"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter phone number"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Business Address</Label>
                      <Input 
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Enter business address"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="logo_url">Logo URL</Label>
                      <Input 
                        id="logo_url"
                        name="logo_url"
                        value={formData.logo_url}
                        onChange={handleInputChange}
                        placeholder="Enter logo URL"
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">System Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="automatic_updates" className="font-medium">Automatic Updates</Label>
                        <p className="text-sm text-muted-foreground">Enable automatic updates for the system</p>
                      </div>
                      <Switch 
                        id="automatic_updates" 
                        checked={formData.automatic_updates}
                        onCheckedChange={(checked) => handleSwitchChange('automatic_updates', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="dark_mode" className="font-medium">Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">Enable dark mode for the system</p>
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
                  <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="notification_emails" className="font-medium">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive important notifications via email</p>
                      </div>
                      <Switch 
                        id="notification_emails" 
                        checked={formData.notification_emails}
                        onCheckedChange={(checked) => handleSwitchChange('notification_emails', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="notification_system" className="font-medium">System Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive in-app notifications about system events</p>
                      </div>
                      <Switch 
                        id="notification_system" 
                        checked={formData.notification_system}
                        onCheckedChange={(checked) => handleSwitchChange('notification_system', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="notification_reports" className="font-medium">Report Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive notifications when reports are generated</p>
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
                  <h3 className="text-lg font-medium mb-4">Security Settings</h3>
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
                  <h3 className="text-lg font-medium mb-4">Localization Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select 
                        value={formData.language} 
                        onValueChange={(value) => handleSelectChange('language', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="arabic">Arabic</SelectItem>
                          <SelectItem value="french">French</SelectItem>
                          <SelectItem value="spanish">Spanish</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select 
                        value={formData.currency} 
                        onValueChange={(value) => handleSelectChange('currency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">US Dollar ($)</SelectItem>
                          <SelectItem value="EUR">Euro (€)</SelectItem>
                          <SelectItem value="GBP">British Pound (£)</SelectItem>
                          <SelectItem value="AED">UAE Dirham (د.إ)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="date_format">Date Format</Label>
                      <Select 
                        value={formData.date_format} 
                        onValueChange={(value) => handleSelectChange('date_format', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select date format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="time_zone">Time Zone</Label>
                      <Select 
                        value={formData.time_zone} 
                        onValueChange={(value) => handleSelectChange('time_zone', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select time zone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                          <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="tools" className="mt-0 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">System Tools</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Specialized tools to help with system operations and data management.
                  </p>
                  
                  {(!serviceStatus.agreementImport || !serviceStatus.customerImport) && (
                    <Alert variant="warning" className="mb-4">
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
                  <h3 className="text-lg font-medium mb-4">Integrations</h3>
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
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              className="flex items-center gap-2"
              disabled={saveSettingsMutation.isPending}
            >
              <Save className="h-4 w-4" />
              {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </Tabs>
      </form>
    </PageContainer>
  );
};

export default SystemSettings;
