import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface CompanySettingsData {
  id?: string;
  company_name?: string;
  business_email?: string;
  phone?: string;
  address?: string;
  logo_url?: string;
}

const CompanySettings = () => {
  const [formData, setFormData] = useState<CompanySettingsData>({
    company_name: '',
    business_email: '',
    phone: '',
    address: '',
    logo_url: '',
  });
  const [settings, setSettings] = useState<CompanySettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('company_settings')
          .select('*')
          .single();

        if (error) {
          console.error('Error fetching company settings:', error);
          toast.error('Failed to load company settings.');
        } else {
          setSettings(data);
          setFormData({
            company_name: data?.company_name || '',
            business_email: data?.business_email || '',
            phone: data?.phone || '',
            address: data?.address || '',
            logo_url: data?.logo_url || '',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const saveSettings = async () => {
    try {
      // Type-safe update for company_settings
      const { data, error } = await supabase
        .from('company_settings')
        .update({
          company_name: formData.company_name,
          business_email: formData.business_email,
          phone: formData.phone,
          address: formData.address,
          logo_url: formData.logo_url
        })
        .eq('id', settings?.id || '')
        .select();
        
      if (error) throw error;

      toast.success('Company settings updated successfully!');
      setSettings(data ? data[0] : null);
    } catch (error) {
      console.error('Error updating company settings:', error);
      toast.error('Failed to update company settings.');
    }
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Settings</CardTitle>
        <CardDescription>Manage your company details and preferences.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="company_name">Company Name</Label>
          <Input
            type="text"
            id="company_name"
            name="company_name"
            value={formData.company_name}
            onChange={handleChange}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="business_email">Business Email</Label>
          <Input
            type="email"
            id="business_email"
            name="business_email"
            value={formData.business_email}
            onChange={handleChange}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="address">Address</Label>
          <Input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="logo_url">Logo URL</Label>
          <Input
            type="text"
            id="logo_url"
            name="logo_url"
            value={formData.logo_url}
            onChange={handleChange}
          />
        </div>
        <Button onClick={saveSettings}>Save Settings</Button>
      </CardContent>
    </Card>
  );
};

export default CompanySettings;
