import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ActivityLog {
  action: string;
  entity_type: string;
  entity_id?: string;
  description?: string;
  performed_by?: string;
  changes?: Record<string, any>;
}

export const useActivityLogger = () => {
  const { toast } = useToast();

  const logActivity = useCallback(async (activity: ActivityLog) => {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          action: activity.action,
          entity_type: activity.entity_type,
          entity_id: activity.entity_id,
          description: activity.description,
          performed_by: activity.performed_by,
          changes: activity.changes,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to log activity:', error);
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }, []);

  const logCustomerActivity = useCallback(async (
    action: 'create' | 'update' | 'delete',
    customerId: string,
    customerName?: string,
    performedBy?: string,
    changes?: Record<string, any>
  ) => {
    const descriptions = {
      create: `تم إنشاء عميل جديد: ${customerName || customerId}`,
      update: `تم تحديث بيانات العميل: ${customerName || customerId}`,
      delete: `تم حذف العميل: ${customerName || customerId}`
    };

    await logActivity({
      action: `customer_${action}`,
      entity_type: 'customer',
      entity_id: customerId,
      description: descriptions[action],
      performed_by: performedBy,
      changes
    });
  }, [logActivity]);

  const logVehicleActivity = useCallback(async (
    action: 'create' | 'update' | 'delete' | 'status_change',
    vehicleId: string,
    vehiclePlate?: string,
    performedBy?: string,
    changes?: Record<string, any>
  ) => {
    const descriptions = {
      create: `تم إضافة مركبة جديدة: ${vehiclePlate || vehicleId}`,
      update: `تم تحديث بيانات المركبة: ${vehiclePlate || vehicleId}`,
      delete: `تم حذف المركبة: ${vehiclePlate || vehicleId}`,
      status_change: `تم تغيير حالة المركبة: ${vehiclePlate || vehicleId}`
    };

    await logActivity({
      action: `vehicle_${action}`,
      entity_type: 'vehicle',
      entity_id: vehicleId,
      description: descriptions[action],
      performed_by: performedBy,
      changes
    });
  }, [logActivity]);

  const logAgreementActivity = useCallback(async (
    action: 'create' | 'update' | 'delete' | 'terminate' | 'activate',
    agreementId: string,
    agreementNumber?: string,
    performedBy?: string,
    changes?: Record<string, any>
  ) => {
    const descriptions = {
      create: `تم إنشاء عقد جديد: ${agreementNumber || agreementId}`,
      update: `تم تحديث العقد: ${agreementNumber || agreementId}`,
      delete: `تم حذف العقد: ${agreementNumber || agreementId}`,
      terminate: `تم إنهاء العقد: ${agreementNumber || agreementId}`,
      activate: `تم تفعيل العقد: ${agreementNumber || agreementId}`
    };

    await logActivity({
      action: `agreement_${action}`,
      entity_type: 'agreement',
      entity_id: agreementId,
      description: descriptions[action],
      performed_by: performedBy,
      changes
    });
  }, [logActivity]);

  const logPaymentActivity = useCallback(async (
    action: 'create' | 'update' | 'delete' | 'process' | 'refund',
    paymentId: string,
    amount?: number,
    performedBy?: string,
    changes?: Record<string, any>
  ) => {
    const descriptions = {
      create: `تم تسجيل دفعة جديدة${amount ? ` بمبلغ ${amount} ر.ق` : ''}`,
      update: `تم تحديث الدفعة${amount ? ` بمبلغ ${amount} ر.ق` : ''}`,
      delete: `تم حذف الدفعة${amount ? ` بمبلغ ${amount} ر.ق` : ''}`,
      process: `تم معالجة الدفعة${amount ? ` بمبلغ ${amount} ر.ق` : ''}`,
      refund: `تم استرداد الدفعة${amount ? ` بمبلغ ${amount} ر.ق` : ''}`
    };

    await logActivity({
      action: `payment_${action}`,
      entity_type: 'payment',
      entity_id: paymentId,
      description: descriptions[action],
      performed_by: performedBy,
      changes
    });
  }, [logActivity]);

  const logMaintenanceActivity = useCallback(async (
    action: 'create' | 'update' | 'complete' | 'schedule',
    maintenanceId: string,
    vehicleInfo?: string,
    performedBy?: string,
    changes?: Record<string, any>
  ) => {
    const descriptions = {
      create: `تم إنشاء عملية صيانة جديدة${vehicleInfo ? ` للمركبة: ${vehicleInfo}` : ''}`,
      update: `تم تحديث عملية الصيانة${vehicleInfo ? ` للمركبة: ${vehicleInfo}` : ''}`,
      complete: `تم إنجاز عملية الصيانة${vehicleInfo ? ` للمركبة: ${vehicleInfo}` : ''}`,
      schedule: `تم جدولة عملية صيانة${vehicleInfo ? ` للمركبة: ${vehicleInfo}` : ''}`
    };

    await logActivity({
      action: `maintenance_${action}`,
      entity_type: 'maintenance',
      entity_id: maintenanceId,
      description: descriptions[action],
      performed_by: performedBy,
      changes
    });
  }, [logActivity]);

  const logSystemActivity = useCallback(async (
    action: string,
    description: string,
    performedBy?: string,
    changes?: Record<string, any>
  ) => {
    await logActivity({
      action,
      entity_type: 'system',
      description,
      performed_by: performedBy,
      changes
    });
  }, [logActivity]);

  return {
    logActivity,
    logCustomerActivity,
    logVehicleActivity,
    logAgreementActivity,
    logPaymentActivity,
    logMaintenanceActivity,
    logSystemActivity
  };
}; 