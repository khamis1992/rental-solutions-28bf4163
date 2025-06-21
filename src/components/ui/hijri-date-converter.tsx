
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowRight, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { 
  hijriToGregorian, 
  gregorianToHijri, 
  formatHijriDateArabic, 
  isValidHijriDate 
} from '@/utils/hijri-date-utils';

interface HijriDateConverterProps {
  initialHijriDate?: string;
  onConvert?: (hijriDate: string, gregorianDate: Date) => void;
}

export const HijriDateConverter: React.FC<HijriDateConverterProps> = ({
  initialHijriDate = '',
  onConvert
}) => {
  const [hijriInput, setHijriInput] = useState(initialHijriDate);
  const [gregorianInput, setGregorianInput] = useState('');
  const [convertedHijri, setConvertedHijri] = useState('');
  const [convertedGregorian, setConvertedGregorian] = useState<Date | null>(null);
  const [copiedHijri, setCopiedHijri] = useState(false);
  const [copiedGregorian, setCopiedGregorian] = useState(false);

  // Convert Hijri to Gregorian
  const handleHijriToGregorian = () => {
    if (!hijriInput.trim()) {
      toast.error('يرجى إدخال تاريخ هجري');
      return;
    }

    if (!isValidHijriDate(hijriInput)) {
      toast.error('تنسيق التاريخ الهجري غير صحيح. استخدم التنسيق: YYYY/MM/DD أو YYYY-MM-DD');
      return;
    }

    const gregorianDate = hijriToGregorian(hijriInput);
    if (gregorianDate) {
      setConvertedGregorian(gregorianDate);
      toast.success('تم تحويل التاريخ الهجري إلى ميلادي بنجاح');
      
      if (onConvert) {
        onConvert(hijriInput, gregorianDate);
      }
    } else {
      toast.error('فشل في تحويل التاريخ الهجري');
    }
  };

  // Convert Gregorian to Hijri
  const handleGregorianToHijri = () => {
    if (!gregorianInput.trim()) {
      toast.error('يرجى إدخال تاريخ ميلادي');
      return;
    }

    const gregorianDate = new Date(gregorianInput);
    if (isNaN(gregorianDate.getTime())) {
      toast.error('تنسيق التاريخ الميلادي غير صحيح');
      return;
    }

    const hijriDate = gregorianToHijri(gregorianDate);
    if (hijriDate) {
      setConvertedHijri(hijriDate);
      toast.success('تم تحويل التاريخ الميلادي إلى هجري بنجاح');
    } else {
      toast.error('فشل في تحويل التاريخ الميلادي');
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, type: 'hijri' | 'gregorian') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'hijri') {
        setCopiedHijri(true);
        setTimeout(() => setCopiedHijri(false), 2000);
      } else {
        setCopiedGregorian(true);
        setTimeout(() => setCopiedGregorian(false), 2000);
      }
      toast.success('تم نسخ التاريخ');
    } catch (error) {
      toast.error('فشل في نسخ التاريخ');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-center" dir="rtl">
          <Calendar className="h-5 w-5" />
          محول التاريخ الهجري والميلادي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6" dir="rtl">
        {/* Hijri to Gregorian Conversion */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="hijri-input" className="text-right block mb-2">
              التاريخ الهجري
            </Label>
            <div className="flex gap-2">
              <Input
                id="hijri-input"
                value={hijriInput}
                onChange={(e) => setHijriInput(e.target.value)}
                placeholder="مثال: 1441/01/16 أو 1441-01-16"
                className="text-right dir-rtl flex-1"
                dir="rtl"
              />
              <Button onClick={handleHijriToGregorian} className="shrink-0">
                تحويل
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1 text-right">
              استخدم التنسيق: سنة/شهر/يوم (مثال: 1441/01/16)
            </p>
          </div>

          {convertedGregorian && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">التاريخ الميلادي:</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(convertedGregorian.toLocaleDateString('ar-SA'), 'gregorian')}
                  className="text-green-600 hover:text-green-700"
                >
                  {copiedGregorian ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="mt-2 space-y-1">
                <Badge variant="secondary" className="text-sm">
                  {convertedGregorian.toLocaleDateString('ar-SA')} م
                </Badge>
                <div className="text-xs text-green-700">
                  {convertedGregorian.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="flex items-center gap-4">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="text-sm text-gray-500">أو</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        {/* Gregorian to Hijri Conversion */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="gregorian-input" className="text-right block mb-2">
              التاريخ الميلادي
            </Label>
            <div className="flex gap-2">
              <Input
                id="gregorian-input"
                type="date"
                value={gregorianInput}
                onChange={(e) => setGregorianInput(e.target.value)}
                className="text-right dir-rtl flex-1"
              />
              <Button onClick={handleGregorianToHijri} className="shrink-0">
                تحويل
              </Button>
            </div>
          </div>

          {convertedHijri && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">التاريخ الهجري:</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(formatHijriDateArabic(convertedHijri), 'hijri')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {copiedHijri ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="mt-2">
                <Badge variant="secondary" className="text-sm">
                  {formatHijriDateArabic(convertedHijri)}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Quick Examples */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium mb-3 text-right">أمثلة سريعة:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHijriInput('1441/01/16')}
              className="text-right justify-start"
            >
              ١٤٤١/٠١/١٦ هـ
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHijriInput('1445/12/15')}
              className="text-right justify-start"
            >
              ١٤٤٥/١٢/١٥ هـ
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
