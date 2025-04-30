
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgeCheck, CreditCard, Lock, Shield, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface PaymentGatewayConfig {
  provider: string;
  Mode: boolean;
  apiKey: string;
  secretKey: string;
  webhookSecret: string;
  enabled: boolean;
}

const PaymentGatewaySettings = () => {
  const [loading, setLoading] = useState(false);
  const [Mode, setTestMode] = useState(true);
  const [config, setConfig] = useState<PaymentGatewayConfig>({
    provider: "stripe",
    Mode: true,
    apiKey: "",
    secretKey: "",
    webhookSecret: "",
    enabled: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (field: keyof PaymentGatewayConfig) => {
    setConfig(prev => ({ ...prev, [field]: !prev[field as keyof PaymentGatewayConfig] }));
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      
      // Normally we would store this in a secure environment variable or Supabase Table
      // This is just for UI demonstration
      
      // Simulating API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Payment gateway settings saved successfully");
    } catch (error: any) {
      toast.error("Failed to save settings: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const Connection = async () => {
    try {
      setLoading(true);
      
      // Simulating API call to  connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Successfully connected to payment gateway");
    } catch (error: any) {
      toast.error("Connection  failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="mr-2 h-5 w-5" />
          Payment Gateway Integration
        </CardTitle>
        <CardDescription>
          Configure your payment gateway for secure transaction processing
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="stripe" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stripe">Stripe</TabsTrigger>
            <TabsTrigger value="paypal">PayPal</TabsTrigger>
            <TabsTrigger value="custom" disabled>Custom</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stripe" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    name="apiKey"
                    value={config.apiKey}
                    onChange={handleInputChange}
                    placeholder="pk_live_..."
                    className="pl-9"
                  />
                  <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secretKey">Secret Key</Label>
                <div className="relative">
                  <Input
                    id="secretKey"
                    name="secretKey"
                    type="password"
                    value={config.secretKey}
                    onChange={handleInputChange}
                    placeholder="sk_live_..."
                    className="pl-9"
                  />
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Note: Secret keys should be stored securely on your server, not in client-side code.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhookSecret">Webhook Secret</Label>
                <div className="relative">
                  <Input
                    id="webhookSecret"
                    name="webhookSecret"
                    type="password"
                    value={config.webhookSecret}
                    onChange={handleInputChange}
                    placeholder="whsec_..."
                    className="pl-9"
                  />
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="enabled" className="text-base">Enable Payment Gateway</Label>
                  <span className="text-muted-foreground text-sm">
                    Activate payment processing on your site
                  </span>
                </div>
                <Switch
                  id="enabled"
                  name="enabled"
                  checked={config.enabled}
                  onCheckedChange={() => handleToggleChange('enabled')}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="paypal">
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">PayPal integration coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2 gap-4">
        <Button
          variant="outline"
          onClick={Connection}
          disabled={loading || !config.apiKey || !config.secretKey}
          className="w-full sm:w-auto"
        >
          Test Connection
        </Button>
        <Button
          onClick={handleSaveSettings}
          disabled={loading || !config.apiKey || !config.secretKey}
          className="w-full sm:w-auto"
        >
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PaymentGatewaySettings;
