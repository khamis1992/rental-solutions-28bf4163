// @ts-nocheck
/* eslint-disable */
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
  testMode: boolean;
  apiKey: string;
  secretKey: string;
  webhookSecret: string;
  enabled: boolean;
}

const PaymentGatewaySettings = () => {
  const [loading, setLoading] = useState(false);
  const [testMode, setTestMode] = useState(true);
  const [config, setConfig] = useState<PaymentGatewayConfig>({
    provider: "stripe",
    testMode: true,
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
      
      // Normally we would store this in a secure environment variable or Supabase // Table - removed unused variable// This is just for UI // demonstration - removed unused variable// Simulating API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("تم حفظ إعدادات بوابة الدفع بنجاح");
    } catch (error: any) {
      toast.error("فشل في حفظ الإعدادات: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setLoading(true);
      
      // Simulating API call to test connection
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("تم الاتصال بنجاح ببوابة الدفع");
    } catch (error: any) {
      toast.error("فشل في اختبار الاتصال: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full" dir="rtl">
      <CardHeader className="text-right">
        <CardTitle className="flex items-center flex-row-reverse">
          <CreditCard className="ml-2 h-5 w-5" />
          تكامل بوابة الدفع
        </CardTitle>
        <CardDescription className="text-right">
          قم بتكوين بوابة الدفع الخاصة بك لمعالجة المعاملات الآمنة
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="stripe" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stripe">سترايب</TabsTrigger>
            <TabsTrigger value="paypal">باي بال</TabsTrigger>
            <TabsTrigger value="custom" disabled>مخصص</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stripe" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-row-reverse">
                <div className="flex flex-col gap-2 text-right">
                  <Label htmlFor="testMode" className="text-base">وضع الاختبار</Label>
                  <span className="text-muted-foreground text-sm">
                    استخدم بيانات اعتماد الاختبار للتطوير
                  </span>
                </div>
                <Switch
                  id="testMode"
                  name="testMode"
                  checked={config.testMode}
                  onCheckedChange={() => handleToggleChange('testMode')}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-right">
                  {config.testMode ? 'مفتاح API للاختبار' : 'مفتاح API المباشر'}
                </Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    name="apiKey"
                    value={config.apiKey}
                    onChange={handleInputChange}
                    placeholder={config.testMode ? 'pk_test_...' : 'pk_live_...'}
                    className="pr-9 text-right"
                    dir="rtl"
                  />
                  <Shield className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secretKey" className="text-right">
                  {config.testMode ? 'المفتاح السري للاختبار' : 'المفتاح السري المباشر'}
                </Label>
                <div className="relative">
                  <Input
                    id="secretKey"
                    name="secretKey"
                    type="password"
                    value={config.secretKey}
                    onChange={handleInputChange}
                    placeholder={config.testMode ? 'sk_test_...' : 'sk_live_...'}
                    className="pr-9 text-right"
                    dir="rtl"
                  />
                  <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  ملاحظة: يجب تخزين المفاتيح السرية بشكل آمن على الخادم الخاص بك، وليس في كود العميل.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhookSecret" className="text-right">سر Webhook</Label>
                <div className="relative">
                  <Input
                    id="webhookSecret"
                    name="webhookSecret"
                    type="password"
                    value={config.webhookSecret}
                    onChange={handleInputChange}
                    placeholder="whsec_..."
                    className="pr-9 text-right"
                    dir="rtl"
                  />
                  <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex items-start flex-row-reverse">
                <AlertCircle className="h-5 w-5 text-amber-500 ml-3 mt-0.5" />
                <div className="text-right">
                  <h4 className="text-sm font-medium text-amber-800">إشعار أمني مهم</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    مفاتيح API هي بيانات اعتماد حساسة. للإنتاج، قم بتخزين هذه القيم في متغيرات البيئة الآمنة.
                    هذه الواجهة مخصصة لأغراض التطوير والاختبار فقط.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 flex-row-reverse">
                <div className="flex flex-col gap-2 text-right">
                  <Label htmlFor="enabled" className="text-base">تفعيل بوابة الدفع</Label>
                  <span className="text-muted-foreground text-sm">
                    تنشيط معالجة المدفوعات في موقعك
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
              <p className="text-muted-foreground text-right">تكامل باي بال قادم قريباً</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex gap-2 flex-row-reverse">
        <Button onClick={handleSaveSettings} disabled={loading}>
          {loading ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </Button>
        <Button variant="outline" onClick={testConnection} disabled={loading}>
          {loading ? "جاري الاختبار..." : "اختبار الاتصال"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PaymentGatewaySettings;
