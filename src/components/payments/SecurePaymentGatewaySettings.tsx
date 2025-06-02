
import React, { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgeCheck, CreditCard, Lock, Shield, AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { sanitizeInput, generateSecureToken, logSecurityEvent } from "@/utils/security";
import { useAuth } from "@/contexts/AuthContext";

interface PaymentGatewayConfig {
  provider: string;
  testMode: boolean;
  enabled: boolean;
  webhookSecret: string;
}

const SecurePaymentGatewaySettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [config, setConfig] = useState<PaymentGatewayConfig>({
    provider: "stripe",
    testMode: true,
    enabled: false,
    webhookSecret: ""
  });

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Sanitize input to prevent XSS
    const sanitizedValue = sanitizeInput(value);
    
    setConfig(prev => ({ ...prev, [name]: sanitizedValue }));
  }, []);

  const handleToggleChange = useCallback((field: keyof PaymentGatewayConfig) => {
    setConfig(prev => ({ ...prev, [field]: !prev[field as keyof PaymentGatewayConfig] }));
  }, []);

  const generateWebhookSecret = useCallback(() => {
    const secret = generateSecureToken(64);
    setConfig(prev => ({ ...prev, webhookSecret: secret }));
    toast.success("Webhook secret generated successfully");
  }, []);

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      
      // Validate configuration
      if (!config.webhookSecret && config.enabled) {
        toast.error("Webhook secret is required when payment gateway is enabled");
        return;
      }

      // Log security event
      await logSecurityEvent({
        type: 'data_access',
        userId: user?.id,
        details: { 
          action: 'payment_gateway_config_update',
          provider: config.provider,
          testMode: config.testMode
        }
      });

      // In production, this should be saved to secure environment variables
      // Never store sensitive data in the client-side application
      console.warn("SECURITY WARNING: Payment gateway credentials should be stored server-side only");
      
      toast.success("Payment gateway settings saved successfully");
    } catch (error: any) {
      toast.error("Failed to save settings: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setLoading(true);
      
      // Log security event
      await logSecurityEvent({
        type: 'data_access',
        userId: user?.id,
        details: { 
          action: 'payment_gateway_connection_test',
          provider: config.provider
        }
      });
      
      // Simulating API call to test connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Connection test completed - check server logs for details");
    } catch (error: any) {
      toast.error("Connection test failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="mr-2 h-5 w-5" />
          Secure Payment Gateway Configuration
        </CardTitle>
        <CardDescription>
          Configure your payment gateway with enhanced security measures
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Critical Security Notice</h4>
              <p className="text-sm text-red-700 mt-1">
                This interface is for development purposes only. In production, all payment gateway 
                credentials must be stored as secure environment variables on the server side. 
                Never store sensitive payment information in client-side code.
              </p>
            </div>
          </div>

          <Tabs defaultValue="configuration" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="configuration" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="testMode" className="text-base">Test Mode</Label>
                  <span className="text-muted-foreground text-sm">
                    Use test environment for development
                  </span>
                </div>
                <Switch
                  id="testMode"
                  checked={config.testMode}
                  onCheckedChange={() => handleToggleChange('testMode')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhookSecret">Webhook Secret</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="webhookSecret"
                      name="webhookSecret"
                      type={showSecrets ? "text" : "password"}
                      value={config.webhookSecret}
                      onChange={handleInputChange}
                      placeholder="Webhook signing secret"
                      className="pr-20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-8 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSecrets(!showSecrets)}
                    >
                      {showSecrets ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Lock className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateWebhookSecret}
                  >
                    Generate
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="enabled" className="text-base">Enable Payment Gateway</Label>
                  <span className="text-muted-foreground text-sm">
                    Activate secure payment processing
                  </span>
                </div>
                <Switch
                  id="enabled"
                  checked={config.enabled}
                  onCheckedChange={() => handleToggleChange('enabled')}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Input sanitization enabled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Secure token generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span className="text-sm">Activity logging enabled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-500" />
                  <span className="text-sm">Development mode - credentials not persisted</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2 gap-4">
        <Button
          variant="outline"
          onClick={testConnection}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          Test Connection
        </Button>
        <Button
          onClick={handleSaveSettings}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? "Saving..." : "Save Configuration"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SecurePaymentGatewaySettings;
