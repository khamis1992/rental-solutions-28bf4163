
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { asProfileId } from '@/utils/database-type-helpers';

interface UserRoleManagerProps {
  userId: string;
  currentRole: string;
  onRoleChanged?: () => void;
}

export function UserRoleManager({ userId, currentRole, onRoleChanged }: UserRoleManagerProps) {
  const [role, setRole] = useState(currentRole);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);
  };

  const updateUserRole = async () => {
    if (role === currentRole) return;

    setIsUpdating(true);
    try {
      // Cast the update value and ID to any to bypass TypeScript complex type checks
      const update = { role } as any;
      const { error } = await supabase
        .from('profiles')
        .update(update)
        .eq('id', asProfileId(userId));

      if (error) throw error;

      toast.success('User role updated successfully');
      if (onRoleChanged) {
        onRoleChanged();
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={role} onValueChange={handleRoleChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="staff">Staff</SelectItem>
          <SelectItem value="customer">Customer</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        disabled={role === currentRole || isUpdating}
        onClick={updateUserRole}
      >
        {isUpdating ? 'Updating...' : 'Update'}
      </Button>
    </div>
  );
}
