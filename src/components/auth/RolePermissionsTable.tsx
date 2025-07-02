import React, { useEffect, useState } from 'react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { UserRole } from '@/types/user-types';
import { PermissionSettings, RolePermissions, DEFAULT_ROLE_PERMISSIONS } from '@/types/permissions';

const RolePermissionsTable = () => {
  const [role, setRole] = useState<UserRole>('admin');
  const [permissions, setPermissions] = useState<RolePermissions>(DEFAULT_ROLE_PERMISSIONS['admin']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPermissions(role);
  }, [role]);

  const fetchPermissions = async (selectedRole: UserRole) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('resource, action')
        .eq('role', selectedRole);

      if (error) throw error;

      const base = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS[selectedRole]));

      data?.forEach(({ resource, action }) => {
        if (base[resource as keyof RolePermissions]) {
          (base[resource as keyof RolePermissions] as any)[action] = true;
        }
      });

      setPermissions(base);
    } catch (err: any) {
      console.error('خطأ في تحميل الصلاحيات:', err.message);
      toast.error('فشل في تحميل الصلاحيات');
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = (section: keyof RolePermissions, action: keyof PermissionSettings, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [action]: value,
      },
    }));
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      const rows: { role: string; resource: string; action: string }[] = [];
      Object.entries(permissions).forEach(([resource, actions]) => {
        Object.entries(actions as PermissionSettings).forEach(([action, allowed]) => {
          if (allowed) rows.push({ role, resource, action });
        });
      });

      const { error: delErr } = await supabase.from('permissions').delete().eq('role', role);
      if (delErr) throw delErr;

      if (rows.length) {
        const { error: insErr } = await supabase.from('permissions').insert(rows);
        if (insErr) throw insErr;
      }

      toast.success('تم تحديث الصلاحيات');
    } catch (err: any) {
      console.error('خطأ في حفظ الصلاحيات:', err.message);
      toast.error('فشل في حفظ الصلاحيات');
    } finally {
      setSaving(false);
      fetchPermissions(role);
    }
  };

  const translateFeatureName = (key: string) => {
    const translations: Record<string, string> = {
      'agreements': 'العقود',
      'customers': 'العملاء',
      'vehicles': 'المركبات',
      'payments': 'المدفوعات',
      'maintenance': 'الصيانة',
      'reports': 'التقارير',
      'users': 'المستخدمون',
      'settings': 'الإعدادات'
    };
    return translations[key.toLowerCase()] || key.replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <Label htmlFor="role-select" className="mb-2 block text-right">الدور</Label>
        <Select value={role} onValueChange={value => setRole(value as UserRole)}>
          <SelectTrigger id="role-select" className="w-[150px]">
            <SelectValue placeholder="اختر الدور" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">مدير</SelectItem>
            <SelectItem value="staff">موظف</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <div className="grid grid-cols-5 p-4 font-medium border-b">
          <div className="text-right">الميزة</div>
          <div className="text-center">عرض</div>
          <div className="text-center">إنشاء</div>
          <div className="text-center">تعديل</div>
          <div className="text-center">حذف</div>
        </div>
        {Object.entries(permissions).map(([key, perm], index) => (
          <div key={key} className={`grid grid-cols-5 p-4 ${index === Object.keys(permissions).length - 1 ? '' : 'border-b'} items-center`}>
            <div className="font-medium text-right">{translateFeatureName(key)}</div>
            <div className="text-center">
              <Switch checked={perm.view} onCheckedChange={val => updatePermission(key as keyof RolePermissions, 'view', val)} />
            </div>
            <div className="text-center">
              <Switch checked={perm.create} onCheckedChange={val => updatePermission(key as keyof RolePermissions, 'create', val)} />
            </div>
            <div className="text-center">
              <Switch checked={perm.edit} onCheckedChange={val => updatePermission(key as keyof RolePermissions, 'edit', val)} />
            </div>
            <div className="text-center">
              <Switch checked={perm.delete} onCheckedChange={val => updatePermission(key as keyof RolePermissions, 'delete', val)} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end flex-row-reverse">
        <Button onClick={savePermissions} disabled={saving}>
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>
    </div>
  );
};

export default RolePermissionsTable;
