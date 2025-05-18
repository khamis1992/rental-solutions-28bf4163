import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
      console.error('Error loading permissions:', err.message);
      toast.error('Failed to load permissions');
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

      toast.success('Permissions updated');
    } catch (err: any) {
      console.error('Error saving permissions:', err.message);
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
      fetchPermissions(role);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="role-select" className="mb-2 block">Role</Label>
        <Select value={role} onValueChange={value => setRole(value as UserRole)}>
          <SelectTrigger id="role-select" className="w-[150px]">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <div className="grid grid-cols-5 p-4 font-medium border-b">
          <div>Feature</div>
          <div className="text-center">View</div>
          <div className="text-center">Create</div>
          <div className="text-center">Edit</div>
          <div className="text-center">Delete</div>
        </div>
        {Object.entries(permissions).map(([key, perm], index) => (
          <div key={key} className={`grid grid-cols-5 p-4 ${index === Object.keys(permissions).length - 1 ? '' : 'border-b'} items-center`}>
            <div className="font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
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

      <div className="flex justify-end">
        <Button onClick={savePermissions} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
      </div>
    </div>
  );
};

export default RolePermissionsTable;
