import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ShieldCheck, Save } from 'lucide-react';

interface SecurityPreferencesProps {
  initialData?: Record<string, any>;
}

const SecurityPreferences = ({ initialData }: SecurityPreferencesProps) => {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState({
    two_factor_auth: initialData?.two_factor_auth ?? false,
    login_alerts: initialData?.login_alerts ?? true,
  });

  const handleSwitchChange = (name: string, checked: boolean) => {
    setPreferences(prev => ({ ...prev, [name]: checked }));
  };

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const operations = Object.entries(data).map(([key, value]) =>
        supabase
          .from('user_security')
          .upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' })
      );
      await Promise.all(operations);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-security'] });
      toast.success('Security preferences saved');
    },
    onError: (error) => {
      toast.error('Failed to save security preferences');
      console.error('Error saving security preferences:', error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(preferences);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          <div>
            <CardTitle>Security Preferences</CardTitle>
            <CardDescription>Manage authentication and security options</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="two_factor_auth" className="font-medium">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Require an additional verification step on login</p>
            </div>
            <Switch
              id="two_factor_auth"
              checked={preferences.two_factor_auth}
              onCheckedChange={(checked) => handleSwitchChange('two_factor_auth', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="login_alerts" className="font-medium">Login Alerts</Label>
              <p className="text-sm text-muted-foreground">Send an alert when a new device logs in</p>
            </div>
            <Switch
              id="login_alerts"
              checked={preferences.login_alerts}
              onCheckedChange={(checked) => handleSwitchChange('login_alerts', checked)}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saveMutation.isPending} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SecurityPreferences;
