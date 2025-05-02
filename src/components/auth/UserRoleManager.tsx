
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserData } from './UserList';
import { withTimeout } from '@/utils/promise-utils';
import { safeQueryToServiceResponse } from '@/utils/supabase-type-helpers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserRoleManagerProps {
  user: UserData;
  onRoleChange: (role: string) => void;
}

export const UserRoleManager: React.FC<UserRoleManagerProps> = ({ user, onRoleChange }) => {
  const [saving, setSaving] = useState(false);
  const roles = ['admin', 'staff', 'customer', 'manager', 'accountant', 'maintenance'];

  const updateUserRole = async (role: string) => {
    setSaving(true);
    
    try {
      const result = await withTimeout(
        safeQueryToServiceResponse(async () => 
          supabase
            .from('profiles')
            .update({ role })
            .eq('id', user.id)
        ),
        5000,
        'Update user role'
      );
      
      if (result.success) {
        toast.success(`Role updated to ${role}`);
        onRoleChange(role);
      } else {
        toast.error(`Failed to update role: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(`Error updating role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <p className="font-medium">User: {user.email}</p>
          <p className="text-sm text-gray-500">Current Role: <span className="font-medium">{user.role}</span></p>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium">Select new role:</p>
          <div className="grid grid-cols-2 gap-2">
            {roles.map((role) => (
              <Button
                key={role}
                variant={role === user.role ? "default" : "outline"}
                size="sm"
                disabled={saving || role === user.role}
                onClick={() => updateUserRole(role)}
                className="justify-start"
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
