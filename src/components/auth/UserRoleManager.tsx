import React, { useState, useEffect } from "react";
import { Shield, UserCog } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { userService } from "@/services";
import { toast } from "sonner";
import { UserRole } from "@/types/user-types";
import { errorLogger } from "@/lib/errors/error-logger";

interface UserRoleManagerProps {
  userId: string;
  currentRole: string;
  fullName: string;
  disabled?: boolean;
}

export const UserRoleManager = ({ 
  userId, 
  currentRole, 
  fullName, 
  disabled = false 
}: UserRoleManagerProps) => {
  const [role, setRole] = useState<string>(currentRole);
  const [isChanging, setIsChanging] = useState(false);

  // Sync role with prop updates
  useEffect(() => {
    setRole(currentRole);
  }, [currentRole]);

  const handleRoleChange = async (newRole: string) => {
    if (newRole === role || disabled || isChanging) return;

    try {
      setIsChanging(true);
      const result = await userService.updateUserRole(userId, newRole as UserRole);

      if (!result.success) {
        throw result.error || new Error('فشل في تحديث الدور');
      }

      setRole(newRole);
      toast.success(`تم تحديث دور ${fullName} إلى ${newRole === 'admin' ? 'مدير' : 'موظف'}`);
    } catch (error: any) {
      errorLogger.logError(error, {
        context: 'UserRoleManager.handleRoleChange',
        userId,
        currentRole,
        newRole,
        fullName
      });
      toast.error(`فشل في تحديث دور ${fullName}`);
      setRole(currentRole);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="flex items-center space-x-reverse space-x-2" dir="rtl">
      {role === "admin" ? (
        <Shield className="h-4 w-4 text-primary" />
      ) : (
        <UserCog className="h-4 w-4 text-blue-500" />
      )}
      
      <Select
        value={role}
        onValueChange={handleRoleChange}
        disabled={disabled || isChanging}
      >
        <SelectTrigger className="w-[130px] h-8">
          <SelectValue placeholder="اختر الدور" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin" className="flex items-center space-x-reverse space-x-2">
            <Shield className="h-4 w-4 ml-2 text-primary" />
            مدير
          </SelectItem>
          <SelectItem value="staff" className="flex items-center space-x-reverse space-x-2">
            <UserCog className="h-4 w-4 ml-2 text-blue-500" />
            موظف
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
