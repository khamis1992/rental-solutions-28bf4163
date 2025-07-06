import React, { useState, useEffect } from 'react';
import { Search, User, Car, CreditCard, AlertCircle, CheckCircle, Star, Zap } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InvoiceData, InvoiceMatchResult } from '@/types/invoice-types';
import { useAgreementMatcher } from '@/hooks/use-invoice-scanner';
import { formatAmount } from '@/utils/invoice-utils';

interface InvoiceMatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceData: InvoiceData;
  matchResult?: InvoiceMatchResult;
  onAgreementSelect: (agreementId: string) => void;
  onCancel?: () => void;
}

interface AgreementOption {
  id: string;
  agreement_number: string;
  customer_name: string;
  vehicle_info: string;
  license_plate?: string;
  rent_amount: number;
  matchScore?: number;
  matchReason?: string;
  isRecommended?: boolean;
}

export function InvoiceMatchDialog({
  open,
  onOpenChange,
  invoiceData,
  matchResult,
  onAgreementSelect,
  onCancel
}: InvoiceMatchDialogProps) {
  const { isSearching, allAgreements, loadAllAgreements } = useAgreementMatcher();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgreement, setSelectedAgreement] = useState<string | null>(null);
  const [filteredAgreements, setFilteredAgreements] = useState<AgreementOption[]>([]);

  // تحميل جميع العقود عند فتح الحوار
  useEffect(() => {
    if (open) {
      loadAllAgreements();
    }
  }, [open, loadAllAgreements]);

  // تحديث قائمة العقود المفلترة
  useEffect(() => {
    let agreements: AgreementOption[] = [];

    // إضافة العقد المطابق تلقائياً (إن وجد)
    if (matchResult?.agreement) {
      agreements.push({
        ...matchResult.agreement,
        vehicle_info: matchResult.agreement.vehicle_info || '',
        matchScore: matchResult.confidence,
        matchReason: getMatchReasonText(matchResult.matchMethod),
        isRecommended: true
      });
    }

    // إضافة البدائل من نتائج المطابقة
    if (matchResult?.alternatives) {
      agreements.push(...matchResult.alternatives.map(alt => ({
        ...alt,
        vehicle_info: alt.vehicle_info || '',
        rent_amount: 0, // سيتم تحديثه من قاعدة البيانات
        isRecommended: false
      })));
    }

    // إضافة باقي العقود النشطة
    const existingIds = new Set(agreements.map(a => a.id));
    const remainingAgreements = allAgreements
      .filter(agreement => !existingIds.has(agreement.id))
      .map(agreement => ({
        ...agreement,
        vehicle_info: agreement.vehicle_info || '',
        rent_amount: 0, // سيتم تحديثه
        isRecommended: false
      }));

    agreements.push(...remainingAgreements);

    // تطبيق البحث
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      agreements = agreements.filter(agreement =>
        agreement.customer_name.toLowerCase().includes(searchLower) ||
        agreement.agreement_number.toLowerCase().includes(searchLower) ||
        agreement.vehicle_info.toLowerCase().includes(searchLower) ||
        agreement.license_plate?.toLowerCase().includes(searchLower)
      );
    }

    // ترتيب العقود: الموصى به أولاً، ثم حسب نقاط المطابقة
    agreements.sort((a, b) => {
      if (a.isRecommended !== b.isRecommended) {
        return a.isRecommended ? -1 : 1;
      }
      return (b.matchScore || 0) - (a.matchScore || 0);
    });

    setFilteredAgreements(agreements);
  }, [matchResult, allAgreements, searchTerm]);

  /**
   * الحصول على نص سبب المطابقة
   */
  function getMatchReasonText(method: string): string {
    switch (method) {
      case 'vehicle_plate':
        return 'مطابقة رقم السيارة';
      case 'customer_name':
        return 'مطابقة اسم العميل';
      case 'manual_selection':
        return 'اختيار يدوي';
      default:
        return 'مطابقة عامة';
    }
  }

  /**
   * الحصول على لون Badge للنقاط
   */
  function getScoreBadgeVariant(score?: number): "default" | "secondary" | "destructive" {
    if (!score) return "secondary";
    if (score >= 0.8) return "default";
    if (score >= 0.5) return "secondary";
    return "destructive";
  }

  /**
   * معالجة اختيار العقد
   */
  const handleAgreementSelect = (agreementId: string) => {
    setSelectedAgreement(agreementId);
  };

  /**
   * تأكيد الاختيار
   */
  const handleConfirm = () => {
    if (selectedAgreement) {
      onAgreementSelect(selectedAgreement);
      onOpenChange(false);
    }
  };

  /**
   * إلغاء الحوار
   */
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            اختيار العقد المناسب
          </DialogTitle>
          <DialogDescription>
            اختر العقد المناسب لربط هذه الفاتورة. العقود الموصى بها تظهر في الأعلى.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* ملخص بيانات الفاتورة */}
          <Card>
            <CardContent className="pt-4">
              <h4 className="font-medium mb-3">بيانات الفاتورة:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {invoiceData.amount && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-green-600" />
                    <span>{formatAmount(invoiceData.amount || 0)}</span>
                  </div>
                )}
                {invoiceData.customerName && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span>{invoiceData.customerName}</span>
                  </div>
                )}
                {invoiceData.vehiclePlate && (
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-purple-600" />
                    <span>{invoiceData.vehiclePlate}</span>
                  </div>
                )}
                {invoiceData.date && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{invoiceData.date}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* شريط البحث */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="البحث في العقود برقم العقد أو اسم العميل أو رقم السيارة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>

          {/* قائمة العقود */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {isSearching ? (
                <div className="text-center py-8">
                  <div className="animate-spin mx-auto mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">جاري البحث...</p>
                </div>
              ) : filteredAgreements.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    لا توجد عقود مطابقة. تأكد من صحة بيانات البحث أو جرب مصطلحات أخرى.
                  </AlertDescription>
                </Alert>
              ) : (
                filteredAgreements.map((agreement) => (
                  <Card
                    key={agreement.id}
                    className={`
                      cursor-pointer transition-all
                      ${selectedAgreement === agreement.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                      }
                      ${agreement.isRecommended ? 'border-green-300 bg-green-50' : ''}
                    `}
                    onClick={() => handleAgreementSelect(agreement.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-lg">
                            عقد {agreement.agreement_number}
                          </h4>
                          {agreement.isRecommended && (
                            <Badge variant="default" className="bg-green-600">
                              <Star className="h-3 w-3 mr-1" />
                              موصى به
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {agreement.matchScore && (
                            <Badge variant={getScoreBadgeVariant(agreement.matchScore)}>
                              {Math.round(agreement.matchScore * 100)}%
                            </Badge>
                          )}
                          {selectedAgreement === agreement.id && (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">العميل: </span>
                          <span className="font-medium">{agreement.customer_name}</span>
                        </div>
                        
                        <div>
                          <span className="text-gray-600">المركبة: </span>
                          <span className="font-medium">
                            {agreement.vehicle_info || 'غير محدد'}
                          </span>
                        </div>
                        
                        {agreement.license_plate && (
                          <div>
                            <span className="text-gray-600">رقم السيارة: </span>
                            <span className="font-medium">{agreement.license_plate}</span>
                          </div>
                        )}
                        
                        {agreement.rent_amount > 0 && (
                          <div>
                            <span className="text-gray-600">قيمة الإيجار: </span>
                            <span className="font-medium">
                              {formatAmount(agreement.rent_amount || 0)}
                            </span>
                          </div>
                        )}
                      </div>

                      {agreement.matchReason && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <span className="text-xs text-gray-500">
                            سبب المطابقة: {agreement.matchReason}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          {/* أزرار الإجراءات */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleConfirm}
              disabled={!selectedAgreement}
              className="flex-1"
              size="lg"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              تأكيد الاختيار
            </Button>
            
            <Button
              variant="outline"
              onClick={handleCancel}
              size="lg"
            >
              إلغاء
            </Button>
          </div>

          {/* نصائح للمستخدم */}
          {matchResult?.alternatives && matchResult.alternatives.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                💡 تم العثور على {matchResult.alternatives.length} عقد مشابه. 
                العقود الموصى بها تظهر مع نجمة خضراء في الأعلى.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 