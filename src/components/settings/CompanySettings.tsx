
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { Building, Upload, Save } from 'lucide-react';

interface CompanySettingsProps {
  initialData?: Record<string, any>;
}

const CompanySettings = ({ initialData }: CompanySettingsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Company settings state
  const [companyData, setCompanyData] = useState({
    company_name: initialData?.company_name || '',
    business_email: initialData?.business_email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    logo_url: initialData?.logo_url || '',
  });
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Save company settings mutation
  const saveCompanySettingsMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const { error } = await supabase
        .from('company_settings')
        .upsert(
          { 
            company_name: data.company_name,
            business_email: data.business_email,
            phone: data.phone,
            address: data.address,
            logo_url: data.logo_url
          },
          { onConflict: 'id' }
        );
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast({
        title: "Company settings saved",
        description: "Your company settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save company settings. Please try again.",
        variant: "destructive",
      });
      console.error("Error saving company settings:", error);
    }
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveCompanySettingsMutation.mutate(companyData);
  };
  
  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `company-logo-${Date.now()}.${fileExt}`;
      
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('company-assets')
        .upload(fileName, file);
        
      if (error) throw error;
      
      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName);
        
      // Update state with new logo URL
      setCompanyData(prev => ({
        ...prev,
        logo_url: publicUrl.publicUrl
      }));
      
      toast({
        title: "Logo uploaded",
        description: "Company logo has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload company logo. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          <CardTitle>Company Information</CardTitle>
        </div>
        <CardDescription>
          Manage your company details and branding
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="h-24 w-24">
                <AvatarImage src={companyData.logo_url} alt="Company logo" />
                <AvatarFallback>{companyData.company_name?.substring(0, 2).toUpperCase() || 'CO'}</AvatarFallback>
              </Avatar>
              
              <div className="flex items-center">
                <Label 
                  htmlFor="logo-upload" 
                  className="cursor-pointer flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Upload className="h-3 w-3" />
                  <span>Upload Logo</span>
                </Label>
                <Input 
                  id="logo-upload" 
                  type="file"
                  accept="image/*"
                  className="hidden" 
                  onChange={handleLogoUpload}
                />
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name <span className="text-red-500">*</span></Label>
                  <Input 
                    id="company_name"
                    name="company_name"
                    value={companyData.company_name}
                    onChange={handleInputChange}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="business_email">Business Email <span className="text-red-500">*</span></Label>
                  <Input 
                    id="business_email"
                    name="business_email"
                    type="email"
                    value={companyData.business_email}
                    onChange={handleInputChange}
                    placeholder="Enter business email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone"
                    name="phone"
                    value={companyData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Input 
                    id="address"
                    name="address"
                    value={companyData.address}
                    onChange={handleInputChange}
                    placeholder="Enter business address"
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="flex items-center gap-2"
                  disabled={saveCompanySettingsMutation.isPending}
                >
                  <Save className="h-4 w-4" />
                  {saveCompanySettingsMutation.isPending ? 'Saving...' : 'Save Company Settings'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CompanySettings;
