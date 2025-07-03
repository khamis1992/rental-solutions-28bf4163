/**
 * خدمة العقود المحسنة مع التخزين المؤقت
 * Optimized Agreement Service with Caching
 */

import { supabase } from '@/lib/supabase';
import { getCachedData, setCachedData, deleteCachedData } from '@/lib/database/simple-cache';
import { CACHE_KEYS, CACHE_TTL } from '@/lib/database/cache-config';
import type { Agreement, AgreementFilters, PaginatedResult } from '@/services/AgreementService';

export class OptimizedAgreementService {
  
  /**
   * الحصول على العقود مع التخزين المؤقت
   */
  async getAgreementsPaginated(
    filters?: AgreementFilters
  ): Promise<PaginatedResult<Agreement>> {
    const startTime = Date.now();
    
    // إنشاء مفتاح كاش فريد بناءً على الفلاتر
    const cacheKey = this.generateCacheKey(CACHE_KEYS.AGREEMENTS_LIST, filters);
    
    // محاولة الحصول من الكاش أولاً
    const cachedResult = await getCachedData<PaginatedResult<Agreement>>(cacheKey);
    if (cachedResult) {
      console.log(`✅ Cache hit for agreements (${Date.now() - startTime}ms)`);
      return cachedResult;
    }

    try {
      // استخدام الدالة المحسنة
      const { data, error } = await supabase.rpc('get_agreements_with_relations', {
        p_limit: filters?.pageSize || 50,
        p_offset: ((filters?.page || 1) - 1) * (filters?.pageSize || 50),
        p_status: filters?.statuses?.[0] || null,
        p_customer_id: filters?.customerId || null,
        p_vehicle_id: filters?.vehicleId || null,
        p_search_term: filters?.searchTerm || null,
        p_start_date: filters?.startDate?.toISOString().split('T')[0] || null,
        p_end_date: filters?.endDate?.toISOString().split('T')[0] || null
      });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const agreements = data || [];
      const totalCount = agreements.length > 0 ? agreements[0].total_count : 0;
      const pageSize = filters?.pageSize || 50;
      const currentPage = filters?.page || 1;

      const result: PaginatedResult<Agreement> = {
        data: agreements.map(this.mapToAgreement),
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage,
        pageSize,
        hasNextPage: currentPage * pageSize < totalCount,
        hasPreviousPage: currentPage > 1
      };

      // حفظ في الكاش
      await setCachedData(cacheKey, result, CACHE_TTL.SHORT);

      console.log(`📊 Fetched ${agreements.length} agreements from DB (${Date.now() - startTime}ms)`);
      return result;

    } catch (error) {
      console.error('❌ Error fetching agreements:', error);
      throw error;
    }
  }

  /**
   * البحث المحسن في العقود
   */
  async searchAgreements(
    searchTerm: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<PaginatedResult<Agreement>> {
    const startTime = Date.now();
    
    const cacheKey = `search:agreements:${searchTerm}:${limit}:${offset}`;
    
    // فحص الكاش
    const cachedResult = await getCachedData<PaginatedResult<Agreement>>(cacheKey);
    if (cachedResult) {
      console.log(`✅ Cache hit for search "${searchTerm}" (${Date.now() - startTime}ms)`);
      return cachedResult;
    }

    try {
      // استخدام دالة البحث المحسنة
      const { data, error } = await supabase.rpc('search_agreements_optimized', {
        p_search_term: searchTerm,
        p_limit: limit,
        p_offset: offset
      });

      if (error) {
        throw new Error(`Search error: ${error.message}`);
      }

      const results = data || [];
      const totalCount = results.length > 0 ? results[0].total_count : 0;

      const result: PaginatedResult<Agreement> = {
        data: results.map(this.mapSearchResultToAgreement),
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Math.floor(offset / limit) + 1,
        pageSize: limit,
        hasNextPage: offset + limit < totalCount,
        hasPreviousPage: offset > 0
      };

      // حفظ في الكاش لفترة قصيرة (البحث يتغير كثيراً)
      await setCachedData(cacheKey, result, 60); // دقيقة واحدة

      console.log(`🔍 Search "${searchTerm}" found ${results.length} results (${Date.now() - startTime}ms)`);
      return result;

    } catch (error) {
      console.error('❌ Search error:', error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات العقود
   */
  async getAgreementStatistics(): Promise<any> {
    const cacheKey = CACHE_KEYS.AGREEMENT_STATS;
    
    // فحص الكاش
    const cachedStats = await getCachedData(cacheKey);
    if (cachedStats) {
      return cachedStats;
    }

    try {
      const { data, error } = await supabase.rpc('get_agreement_statistics');

      if (error) {
        throw new Error(`Statistics error: ${error.message}`);
      }

      // حفظ في الكاش لمدة ساعة
      await setCachedData(cacheKey, data, CACHE_TTL.LONG);

      return data;
    } catch (error) {
      console.error('❌ Error fetching statistics:', error);
      throw error;
    }
  }

  /**
   * الحصول على عقد واحد مع الكاش
   */
  async getAgreementById(id: string): Promise<Agreement | null> {
    const cacheKey = `agreement:${id}`;
    
    // فحص الكاش
    const cachedAgreement = await getCachedData<Agreement>(cacheKey);
    if (cachedAgreement) {
      return cachedAgreement;
    }

    try {
      const { data, error } = await supabase
        .from('agreements_full_view')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return null;
      }

      const agreement = this.mapViewToAgreement(data);
      
      // حفظ في الكاش
      await setCachedData(cacheKey, agreement, CACHE_TTL.MEDIUM);

      return agreement;
    } catch (error) {
      console.error('❌ Error fetching agreement:', error);
      return null;
    }
  }

  /**
   * إنشاء عقد جديد مع إبطال الكاش
   */
  async createAgreement(agreementData: Partial<Agreement>): Promise<Agreement> {
    try {
      const { data, error } = await supabase
        .from('leases')
        .insert(agreementData)
        .select()
        .single();

      if (error) {
        throw new Error(`Create error: ${error.message}`);
      }

      // إبطال الكاش المرتبط
      await this.invalidateRelatedCache();

      return data;
    } catch (error) {
      console.error('❌ Error creating agreement:', error);
      throw error;
    }
  }

  /**
   * تحديث عقد مع إبطال الكاش
   */
  async updateAgreement(id: string, updates: Partial<Agreement>): Promise<Agreement> {
    try {
      const { data, error } = await supabase
        .from('leases')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Update error: ${error.message}`);
      }

      // إبطال الكاش
      await deleteCachedData(`agreement:${id}`);
      await this.invalidateRelatedCache();

      return data;
    } catch (error) {
      console.error('❌ Error updating agreement:', error);
      throw error;
    }
  }

  /**
   * حذف عقد مع إبطال الكاش
   */
  async deleteAgreement(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('leases')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Delete error: ${error.message}`);
      }

      // إبطال الكاش
      await deleteCachedData(`agreement:${id}`);
      await this.invalidateRelatedCache();

      return true;
    } catch (error) {
      console.error('❌ Error deleting agreement:', error);
      return false;
    }
  }

  /**
   * إبطال الكاش المرتبط بالعقود
   */
  private async invalidateRelatedCache(): Promise<void> {
    const keysToInvalidate = [
      CACHE_KEYS.AGREEMENTS_LIST,
      CACHE_KEYS.AGREEMENT_STATS,
      CACHE_KEYS.DASHBOARD_DATA
    ];

    await Promise.all(
      keysToInvalidate.map(key => deleteCachedData(key))
    );
  }

  /**
   * إنشاء مفتاح كاش فريد
   */
  private generateCacheKey(baseKey: string, filters?: AgreementFilters): string {
    if (!filters) return baseKey;

    const filterString = JSON.stringify({
      page: filters.page,
      pageSize: filters.pageSize,
      statuses: filters.statuses,
      customerId: filters.customerId,
      vehicleId: filters.vehicleId,
      searchTerm: filters.searchTerm,
      startDate: filters.startDate?.toISOString(),
      endDate: filters.endDate?.toISOString()
    });

    return `${baseKey}:${btoa(filterString)}`;
  }

  /**
   * تحويل نتيجة RPC إلى Agreement
   */
  private mapToAgreement(row: any): Agreement {
    return {
      id: row.id,
      agreement_number: row.agreement_number,
      status: row.status,
      start_date: row.start_date,
      end_date: row.end_date,
      rent_amount: row.rent_amount,
      deposit_amount: row.deposit_amount,
      customer_id: row.customer_id,
      vehicle_id: row.vehicle_id,
      created_at: row.created_at,
      customer_name: row.customer_name,
      customer_email: row.customer_email,
      customer_phone: row.customer_phone,
      vehicle_make: row.vehicle_make,
      vehicle_model: row.vehicle_model,
      vehicle_license_plate: row.vehicle_license_plate,
      vehicle_year: row.vehicle_year
    } as Agreement;
  }

  /**
   * تحويل نتيجة البحث إلى Agreement
   */
  private mapSearchResultToAgreement(row: any): Agreement {
    return {
      id: row.id,
      agreement_number: row.agreement_number,
      status: row.status,
      rent_amount: row.rent_amount,
      created_at: row.created_at,
      customer_name: row.customer_name,
      vehicle_info: row.vehicle_info,
      match_type: row.match_type
    } as Agreement;
  }

  /**
   * تحويل View إلى Agreement
   */
  private mapViewToAgreement(row: any): Agreement {
    return {
      id: row.id,
      agreement_number: row.agreement_number,
      status: row.status,
      start_date: row.start_date,
      end_date: row.end_date,
      rent_amount: row.rent_amount,
      deposit_amount: row.deposit_amount,
      customer_id: row.customer_id,
      vehicle_id: row.vehicle_id,
      created_at: row.created_at,
      customer_name: row.customer_name,
      customer_email: row.customer_email,
      customer_phone: row.customer_phone,
      vehicle_make: row.vehicle_make,
      vehicle_model: row.vehicle_model,
      vehicle_license_plate: row.vehicle_license_plate,
      vehicle_year: row.vehicle_year,
      total_payments: row.total_payments,
      paid_amount: row.paid_amount,
      overdue_payments: row.overdue_payments
    } as Agreement;
  }
}

export const optimizedAgreementService = new OptimizedAgreementService(); 