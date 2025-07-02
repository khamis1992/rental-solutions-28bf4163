// @ts-nocheck
/* eslint-disable */
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Separator } from '@/components/ui/separator';
import { 
  formatQatarRiyal, 
  parseQatarRiyal, 
  validateQatarRiyal,
  qatarRiyalFormatters,
  qatarCurrencyConfig,
  convertToArabicNumerals,
  convertToWesternNumerals
} from '@/utils/arabic-rtl-utils';
import { Calculator, DollarSign, TrendingUp, Banknote } from 'lucide-react';

export const QatarCurrencyDemo: React.FC = () => {
  const [inputAmount, setInputAmount] = useState('1500.75');
  const [useArabicNumerals, setUseArabicNumerals] = useState(false);

  const amount = parseQatarRiyal(inputAmount);

  const demoAmounts = [
    100,
    1500.75,
    25000,
    150000,
    1250000,
    -500.25,
    0
  ];

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">عرض تنسيق الريال القطري</h1>
        <p className="text-muted-foreground">
          نظام شامل لتنسيق وعرض العملة القطرية في واجهة المستخدم العربية
        </p>
      </div>

      {/* Interactive Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            تجربة تفاعلية
          </CardTitle>
          <CardDescription>
            أدخل مبلغاً لرؤية التنسيقات المختلفة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ</Label>
              <Input
                id="amount"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                placeholder="أدخل المبلغ"
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label>الأرقام العربية</Label>
              <Button
                variant={useArabicNumerals ? "default" : "outline"}
                onClick={() => setUseArabicNumerals(!useArabicNumerals)}
                className="w-full"
              >
                {useArabicNumerals ? 'مفعل' : 'معطل'}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>التنسيق الافتراضي</Label>
              <div className="p-3 bg-muted rounded-md text-center font-mono">
                {formatQatarRiyal(amount, { useArabicNumerals })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>التنسيق المضغوط</Label>
              <div className="p-3 bg-muted rounded-md text-center font-mono">
                {formatQatarRiyal(amount, { compact: true, useArabicNumerals })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>تنسيق المحاسبة</Label>
              <div className="p-3 bg-muted rounded-md text-center font-mono">
                {qatarRiyalFormatters.accounting(amount)}
              </div>
            </div>

            <div className="space-y-2">
              <Label>تنسيق الفاتورة</Label>
              <div className="p-3 bg-muted rounded-md text-center font-mono">
                {qatarRiyalFormatters.invoice(amount)}
              </div>
            </div>

            <div className="space-y-2">
              <Label>للإدخال (بدون رمز)</Label>
              <div className="p-3 bg-muted rounded-md text-center font-mono">
                {qatarRiyalFormatters.input(amount)}
              </div>
            </div>

            <div className="space-y-2">
              <Label>للتصدير</Label>
              <div className="p-3 bg-muted rounded-md text-center font-mono">
                {qatarRiyalFormatters.export(amount)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            إعدادات العملة القطرية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>الرمز الأساسي</Label>
              <Badge variant="outline" className="text-lg p-2">
                {qatarCurrencyConfig.symbol}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label>الكود الدولي</Label>
              <Badge variant="outline" className="text-lg p-2">
                {qatarCurrencyConfig.code}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label>المنطقة المحلية</Label>
              <Badge variant="outline" className="text-lg p-2">
                {qatarCurrencyConfig.locale}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label>الاسم المفرد</Label>
              <Badge variant="outline" className="text-lg p-2">
                {qatarCurrencyConfig.denominations.singular}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label>الوحدة الفرعية</Label>
              <Badge variant="outline" className="text-lg p-2">
                {qatarCurrencyConfig.denominations.subunit}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label>المنازل العشرية</Label>
              <Badge variant="outline" className="text-lg p-2">
                {qatarCurrencyConfig.decimalPlaces}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Amounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            أمثلة على المبالغ
          </CardTitle>
          <CardDescription>
            عرض تنسيقات مختلفة لمبالغ متنوعة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {demoAmounts.map((demoAmount, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">المبلغ الأصلي:</span>
                  <span className="font-mono">{demoAmount}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">افتراضي</div>
                    <div className="font-mono bg-muted p-2 rounded text-center">
                      {qatarRiyalFormatters.display(demoAmount)}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-muted-foreground">مضغوط</div>
                    <div className="font-mono bg-muted p-2 rounded text-center">
                      {qatarRiyalFormatters.compact(demoAmount)}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-muted-foreground">محاسبة</div>
                    <div className="font-mono bg-muted p-2 rounded text-center">
                      {qatarRiyalFormatters.accounting(demoAmount)}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-muted-foreground">أرقام عربية</div>
                    <div className="font-mono bg-muted p-2 rounded text-center">
                      {formatQatarRiyal(demoAmount, { useArabicNumerals: true })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Amounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            المبالغ السريعة
          </CardTitle>
          <CardDescription>
            مبالغ شائعة للاختيار السريع
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {qatarCurrencyConfig.commonAmounts.map((commonAmount) => (
              <Button
                key={commonAmount}
                variant="outline"
                onClick={() => setInputAmount(commonAmount.toString())}
                className="h-12 text-sm"
              >
                {qatarRiyalFormatters.compact(commonAmount)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Validation Demo */}
      <Card>
        <CardHeader>
          <CardTitle>التحقق من صحة المبلغ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>التحقق الأساسي</Label>
                <div className={`p-3 rounded-md ${
                  validateQatarRiyal(inputAmount) 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {validateQatarRiyal(inputAmount) || 'صحيح'}
                </div>
              </div>

              <div className="space-y-2">
                <Label>مع حد أدنى (100)</Label>
                <div className={`p-3 rounded-md ${
                  validateQatarRiyal(inputAmount, { min: 100 }) 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {validateQatarRiyal(inputAmount, { min: 100 }) || 'صحيح'}
                </div>
              </div>

              <div className="space-y-2">
                <Label>مع حد أقصى (10000)</Label>
                <div className={`p-3 rounded-md ${
                  validateQatarRiyal(inputAmount, { max: 10000 }) 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {validateQatarRiyal(inputAmount, { max: 10000 }) || 'صحيح'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 