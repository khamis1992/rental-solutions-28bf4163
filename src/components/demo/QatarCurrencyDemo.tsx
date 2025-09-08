// @ts-nocheck
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const [customFormat, setCustomFormat] = useState('');
  const [validationInput, setValidationInput] = useState('QAR 1,234.56');

  const { formatQatariCurrency } = qatarRiyalFormatters;

  // Parse the input amount
  const parsedAmount = useMemo(() => {
    try {
      return parseQatarRiyal(inputAmount) || 0;
    } catch {
      return 0;
    }
  }, [inputAmount]);

  // Validation result
  const validationResult = useMemo(() => {
    return validateQatarRiyal(validationInput);
  }, [validationInput]);

  const formatExamples = [
    {
      name: 'افتراضي',
      formatter: (amount: number) => formatQatarRiyal(amount),
      description: 'التنسيق الافتراضي للريال القطري'
    },
    {
      name: 'مختصر',
      formatter: (amount: number) => formatQatarRiyal(amount, { 
        style: 'currency', 
        currency: 'QAR',
        currencyDisplay: 'code'
      }),
      description: 'عرض رمز العملة فقط'
    },
    {
      name: 'كامل',
      formatter: (amount: number) => formatQatarRiyal(amount, {
        style: 'currency',
        currency: 'QAR',
        currencyDisplay: 'name'
      }),
      description: 'عرض الاسم الكامل للعملة'
    },
    {
      name: 'بدون رمز',
      formatter: (amount: number) => formatQatarRiyal(amount, {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }),
      description: 'أرقام فقط مع فواصل'
    },
    {
      name: 'مدمج',
      formatter: (amount: number) => formatQatariCurrency(amount),
      description: 'منسق خاص للنظام'
    }
  ];

  const testAmounts = [
    0,
    1,
    10.5,
    100,
    1000,
    1234.56,
    10000,
    100000.99,
    1000000
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <Banknote className="w-6 h-6" />
            عرض تنسيق الريال القطري
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <DollarSign className="w-4 h-4" />
            <AlertDescription>
              هذا العرض يوضح كيفية تنسيق وعرض العملة القطرية بطرق مختلفة مع دعم RTL
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Input Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            اختبار الإدخال والتحليل
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount-input">أدخل مبلغاً:</Label>
            <Input
              id="amount-input"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              placeholder="1500.75"
              className="text-right"
            />
            <div className="text-sm text-muted-foreground">
              القيمة المحللة: <Badge variant="outline">{parsedAmount}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formatExamples.map((example, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="font-medium mb-1">{example.name}</div>
                <div className="text-lg font-mono bg-muted p-2 rounded text-right">
                  {example.formatter(parsedAmount)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {example.description}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Validation Testing */}
      <Card>
        <CardHeader>
          <CardTitle>اختبار التحقق من صحة العملة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="validation-input">نص للتحقق:</Label>
            <Input
              id="validation-input"
              value={validationInput}
              onChange={(e) => setValidationInput(e.target.value)}
              placeholder="QAR 1,234.56"
              className="text-right"
            />
          </div>

          <div className="p-3 border rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">صحيح:</span>
                <Badge variant={validationResult.isValid ? "default" : "destructive"} className="ml-2">
                  {validationResult.isValid ? 'نعم' : 'لا'}
                </Badge>
              </div>
              <div>
                <span className="font-medium">القيمة:</span>
                <Badge variant="outline" className="ml-2">
                  {validationResult.value || 'غير محدد'}
                </Badge>
              </div>
              <div className="col-span-2">
                <span className="font-medium">الأخطاء:</span>
                {validationResult.errors.length > 0 ? (
                  <ul className="mt-1 text-red-600 text-xs">
                    {validationResult.errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                ) : (
                  <Badge variant="default" className="ml-2 text-xs">لا توجد أخطاء</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Amount Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            أمثلة على مبالغ مختلفة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {testAmounts.map((amount, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">المبلغ: {amount}</div>
                <div className="font-mono text-lg text-right">
                  {formatQatarRiyal(amount)}
                </div>
                <div className="font-mono text-sm text-muted-foreground text-right">
                  {formatQatariCurrency(amount)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Display */}
      <Card>
        <CardHeader>
          <CardTitle>إعدادات العملة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">رمز العملة:</div>
              <Badge variant="outline">{qatarCurrencyConfig.code}</Badge>
            </div>
            <div>
              <div className="font-medium">الرمز:</div>
              <Badge variant="outline">{qatarCurrencyConfig.symbol}</Badge>
            </div>
            <div>
              <div className="font-medium">المنازل العشرية:</div>
              <Badge variant="outline">{qatarCurrencyConfig.decimals}</Badge>
            </div>
            <div>
              <div className="font-medium">الاسم باللغة العربية:</div>
              <Badge variant="outline">{qatarCurrencyConfig.nameAr}</Badge>
            </div>
            <div>
              <div className="font-medium">الاسم باللغة الإنجليزية:</div>
              <Badge variant="outline">{qatarCurrencyConfig.nameEn}</Badge>
            </div>
            <div>
              <div className="font-medium">فاصل الآلاف:</div>
              <Badge variant="outline">"{qatarCurrencyConfig.thousandsSeparator}"</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};