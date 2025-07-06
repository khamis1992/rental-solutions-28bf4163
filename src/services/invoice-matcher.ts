import { supabase } from '../integrations/supabase/client';
import { InvoiceData, InvoiceMatchResult } from '../types/invoice-types';

// خدمة المطابقة الذكية للعقود
export class InvoiceMatcherService {
  
  /**
   * العثور على العقد المناسب للفاتورة
   */
  async findMatchingAgreement(invoiceData: InvoiceData): Promise<InvoiceMatchResult> {
    try {
      let matchResult: InvoiceMatchResult = {
        matchMethod: 'none',
        confidence: 0,
        alternatives: []
      };

      // المطابقة برقم السيارة (أولوية عالية)
      if (invoiceData.vehiclePlate) {
        const plateMatch = await this.matchByVehiclePlate(invoiceData.vehiclePlate);
        if (plateMatch.agreement) {
          matchResult = plateMatch;
          matchResult.matchMethod = 'vehicle_plate';
        }
      }

      // المطابقة باسم العميل (إذا لم نجد بالسيارة)
      if (!matchResult.agreement && invoiceData.customerName) {
        const customerMatch = await this.matchByCustomerName(invoiceData.customerName);
        if (customerMatch.agreement) {
          matchResult = customerMatch;
          matchResult.matchMethod = 'customer_name';
        }
      }

      // البحث عن بدائل إضافية
      if (matchResult.confidence < 0.8) {
        const alternatives = await this.findAlternativeMatches(invoiceData);
        matchResult.alternatives = alternatives;
      }

      return matchResult;

    } catch (error) {
      console.error('❌ خطأ في المطابقة:', error);
      return {
        matchMethod: 'none',
        confidence: 0,
        alternatives: []
      };
    }
  }

  /**
   * المطابقة برقم السيارة
   */
  private async matchByVehiclePlate(plateNumber: string): Promise<InvoiceMatchResult> {
    try {
      // تنظيف رقم السيارة
      const cleanedPlate = this.cleanPlateNumber(plateNumber);
      
      // البحث في العقود النشطة
      const { data: agreements, error } = await supabase
        .from('leases')
        .select(`
          id,
          agreement_number,
          license_plate,
          rent_amount,
          status,
          profiles!customer_id (
            id,
            full_name,
            phone,
            nationality
          ),
          vehicles!vehicle_id (
            id,
            make,
            model,
            year,
            license_plate
          )
        `)
        .eq('status', 'active')
        .not('vehicles.license_plate', 'is', null);

      if (error) {
        console.error('خطأ في جلب العقود:', error);
        return { matchMethod: 'none', confidence: 0 };
      }

      // البحث عن مطابقة دقيقة
      const exactMatch = agreements?.find(agreement => {
        const vehiclePlate = agreement.vehicles?.license_plate;
        if (!vehiclePlate) return false;
        
        const cleanedDbPlate = this.cleanPlateNumber(vehiclePlate);
        return this.comparePlateNumbers(cleanedPlate, cleanedDbPlate);
      });

      if (exactMatch) {
        return {
          agreement: {
            id: exactMatch.id,
            agreement_number: exactMatch.agreement_number,
            customer_name: exactMatch.profiles?.full_name || 'غير محدد',
            vehicle_info: `${exactMatch.vehicles?.make || ''} ${exactMatch.vehicles?.model || ''} ${exactMatch.vehicles?.year || ''}`.trim(),
            license_plate: exactMatch.vehicles?.license_plate || '',
            rent_amount: exactMatch.rent_amount,
            status: exactMatch.status
          },
          matchMethod: 'vehicle_plate',
          confidence: 0.95
        };
      }

      // البحث عن مطابقة جزئية
      const partialMatches = agreements?.filter(agreement => {
        const vehiclePlate = agreement.vehicles?.license_plate;
        if (!vehiclePlate) return false;
        
        const cleanedDbPlate = this.cleanPlateNumber(vehiclePlate);
        return this.isPartialPlateMatch(cleanedPlate, cleanedDbPlate);
      }) || [];

      if (partialMatches.length === 1) {
        const match = partialMatches[0];
        return {
          agreement: {
            id: match.id,
            agreement_number: match.agreement_number,
            customer_name: match.profiles?.full_name || 'غير محدد',
            vehicle_info: `${match.vehicles?.make || ''} ${match.vehicles?.model || ''} ${match.vehicles?.year || ''}`.trim(),
            license_plate: match.vehicles?.license_plate || '',
            rent_amount: match.rent_amount,
            status: match.status
          },
          matchMethod: 'vehicle_plate',
          confidence: 0.7
        };
      }

      return { matchMethod: 'none', confidence: 0 };

    } catch (error) {
      console.error('خطأ في المطابقة برقم السيارة:', error);
      return { matchMethod: 'none', confidence: 0 };
    }
  }

  /**
   * المطابقة باسم العميل
   */
  private async matchByCustomerName(customerName: string): Promise<InvoiceMatchResult> {
    try {
      const cleanedName = this.cleanCustomerName(customerName);
      
      const { data: agreements, error } = await supabase
        .from('leases')
        .select(`
          id,
          agreement_number,
          license_plate,
          rent_amount,
          status,
          profiles!customer_id (
            id,
            full_name,
            phone,
            nationality
          ),
          vehicles!vehicle_id (
            id,
            make,
            model,
            year,
            license_plate
          )
        `)
        .eq('status', 'active');

      if (error) {
        console.error('خطأ في جلب العقود:', error);
        return { matchMethod: 'none', confidence: 0 };
      }

      // البحث عن أفضل مطابقة للاسم
      let bestMatch: any = null;
      let bestScore = 0;

      agreements?.forEach(agreement => {
        if (agreement.profiles?.full_name) {
          const score = this.calculateNameSimilarity(cleanedName, agreement.profiles.full_name);
          if (score > bestScore && score > 0.6) {
            bestScore = score;
            bestMatch = agreement;
          }
        }
      });

      if (bestMatch) {
        return {
          agreement: {
            id: bestMatch.id,
            agreement_number: bestMatch.agreement_number,
            customer_name: bestMatch.profiles?.full_name || 'غير محدد',
            vehicle_info: `${bestMatch.vehicles?.make || ''} ${bestMatch.vehicles?.model || ''} ${bestMatch.vehicles?.year || ''}`.trim(),
            license_plate: bestMatch.vehicles?.license_plate || '',
            rent_amount: bestMatch.rent_amount,
            status: bestMatch.status
          },
          matchMethod: 'customer_name',
          confidence: bestScore
        };
      }

      return { matchMethod: 'none', confidence: 0 };

    } catch (error) {
      console.error('خطأ في المطابقة باسم العميل:', error);
      return { matchMethod: 'none', confidence: 0 };
    }
  }

  /**
   * البحث عن بدائل إضافية
   */
  private async findAlternativeMatches(invoiceData: InvoiceData): Promise<Array<{
    id: string;
    agreement_number: string;
    customer_name: string;
    vehicle_info: string;
    matchScore: number;
    matchReason: string;
  }>> {
    try {
      const { data: agreements, error } = await supabase
        .from('leases')
        .select(`
          id,
          agreement_number,
          license_plate,
          rent_amount,
          status,
          profiles!customer_id (
            id,
            full_name,
            phone,
            nationality
          ),
          vehicles!vehicle_id (
            id,
            make,
            model,
            year,
            license_plate
          )
        `)
        .eq('status', 'active')
        .limit(10);

      if (error) return [];

      const alternatives: any[] = [];

      agreements?.forEach(agreement => {
        let score = 0;
        let reason = '';

        // تقييم المطابقة بناءً على المبلغ
        if (invoiceData.amount && agreement.rent_amount) {
          const amountDiff = Math.abs(invoiceData.amount - agreement.rent_amount) / agreement.rent_amount;
          if (amountDiff < 0.1) { // مطابقة بنسبة 90%
            score += 0.4;
            reason += 'مبلغ مطابق، ';
          } else if (amountDiff < 0.2) {
            score += 0.2;
            reason += 'مبلغ قريب، ';
          }
        }

        // تقييم المطابقة بناءً على الاسم (جزئي)
        if (invoiceData.customerName && agreement.profiles?.full_name) {
          const nameScore = this.calculateNameSimilarity(invoiceData.customerName, agreement.profiles.full_name);
          if (nameScore > 0.3) {
            score += nameScore * 0.3;
            reason += 'اسم مشابه، ';
          }
        }

        // تقييم المطابقة بناءً على رقم السيارة (جزئي)
        if (invoiceData.vehiclePlate && agreement.vehicles?.license_plate) {
          if (this.isPartialPlateMatch(invoiceData.vehiclePlate, agreement.vehicles.license_plate)) {
            score += 0.3;
            reason += 'رقم سيارة مشابه، ';
          }
        }

        if (score > 0.2) {
          alternatives.push({
            id: agreement.id,
            agreement_number: agreement.agreement_number,
            customer_name: agreement.profiles?.full_name || 'غير محدد',
            vehicle_info: `${agreement.vehicles?.make || ''} ${agreement.vehicles?.model || ''} ${agreement.vehicles?.year || ''}`.trim(),
            matchScore: score,
            matchReason: reason.slice(0, -2) // إزالة آخر فاصلة
          });
        }
      });

      // ترتيب البدائل حسب النقاط
      return alternatives.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);

    } catch (error) {
      console.error('خطأ في البحث عن البدائل:', error);
      return [];
    }
  }

  /**
   * تنظيف رقم السيارة
   */
  private cleanPlateNumber(plate: string): string {
    return plate
      .replace(/\s+/g, '') // إزالة المسافات
      .replace(/[^\w\d]/g, '') // إزالة الرموز الخاصة
      .toUpperCase(); // تحويل للأحرف الكبيرة
  }

  /**
   * مقارنة أرقام السيارات
   */
  private comparePlateNumbers(plate1: string, plate2: string): boolean {
    return plate1 === plate2;
  }

  /**
   * التحقق من المطابقة الجزئية لأرقام السيارات
   */
  private isPartialPlateMatch(plate1: string, plate2: string): boolean {
    const clean1 = this.cleanPlateNumber(plate1);
    const clean2 = this.cleanPlateNumber(plate2);
    
    // استخراج الأرقام فقط
    const numbers1 = clean1.replace(/[A-Z]/g, '');
    const numbers2 = clean2.replace(/[A-Z]/g, '');
    
    // استخراج الأحرف فقط
    const letters1 = clean1.replace(/[0-9]/g, '');
    const letters2 = clean2.replace(/[0-9]/g, '');
    
    // مطابقة جزئية: نفس الأرقام أو نفس الأحرف
    return numbers1 === numbers2 || letters1 === letters2;
  }

  /**
   * تنظيف اسم العميل
   */
  private cleanCustomerName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ') // توحيد المسافات
      .toLowerCase()
      .replace(/[^\u0600-\u06FFa-z\s]/g, ''); // الاحتفاظ بالعربية والإنجليزية فقط
  }

  /**
   * حساب مدى التشابه بين الأسماء
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    const clean1 = this.cleanCustomerName(name1);
    const clean2 = this.cleanCustomerName(name2);
    
    // مطابقة دقيقة
    if (clean1 === clean2) return 1.0;
    
    // تقسيم الأسماء إلى كلمات
    const words1 = clean1.split(' ').filter(w => w.length > 1);
    const words2 = clean2.split(' ').filter(w => w.length > 1);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    // حساب عدد الكلمات المطابقة
    let matchingWords = 0;
    words1.forEach(word1 => {
      if (words2.some(word2 => 
        word1.includes(word2) || 
        word2.includes(word1) || 
        this.levenshteinDistance(word1, word2) <= 1
      )) {
        matchingWords++;
      }
    });
    
    // حساب النسبة
    return matchingWords / Math.max(words1.length, words2.length);
  }

  /**
   * حساب مسافة Levenshtein للنصوص المتشابهة
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * الحصول على جميع العقود النشطة للاختيار اليدوي
   */
  async getAllActiveAgreements(): Promise<InvoiceMatchResult['alternatives']> {
    try {
      const { data: agreements, error } = await supabase
        .from('leases')
        .select(`
          id,
          agreement_number,
          license_plate,
          rent_amount,
          status,
          profiles!customer_id (
            id,
            full_name,
            phone,
            nationality
          ),
          vehicles!vehicle_id (
            id,
            make,
            model,
            year,
            license_plate
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('خطأ في جلب العقود:', error);
        return [];
      }

      return agreements?.map(agreement => ({
        id: agreement.id,
        agreement_number: agreement.agreement_number,
        customer_name: agreement.profiles?.full_name || 'غير محدد',
        vehicle_info: `${agreement.vehicles?.make || ''} ${agreement.vehicles?.model || ''} ${agreement.vehicles?.year || ''}`.trim(),
        matchScore: 0.5, // درجة افتراضية للاختيار اليدوي
        matchReason: 'اختيار يدوي'
      })) || [];

    } catch (error) {
      console.error('خطأ في جلب العقود النشطة:', error);
      return [];
    }
  }
}

// إنشاء instance مشترك
export const invoiceMatcherService = new InvoiceMatcherService(); 