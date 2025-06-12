import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface RolePermissionsTableProps {
  role: string;
  permissions: { [key: string]: boolean };
  onPermissionChange: (permission: string, checked: boolean) => void;
}

export function RolePermissionsTable({ role, permissions, onPermissionChange }: RolePermissionsTableProps) {
  const [localPermissions, setLocalPermissions] = useState(permissions);

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setLocalPermissions(prev => ({ ...prev, [permission]: checked }));
    onPermissionChange(permission, checked);
  };

  const permissionsList = [
    "read:agreements",
    "create:agreements",
    "update:agreements",
    "delete:agreements",
    "read:customers",
    "create:customers",
    "update:customers",
    "delete:customers",
    "read:vehicles",
    "create:vehicles",
    "update:vehicles",
    "delete:vehicles",
    "read:payments",
    "create:payments",
    "update:payments",
    "delete:payments",
    "read:users",
    "create:users",
    "update:users",
    "delete:users",
    "read:roles",
    "create:roles",
    "update:roles",
    "delete:roles",
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Role Permissions - {role}</CardTitle>
        <CardContent>
          <Badge variant="secondary">
            Modify permissions for this role
          </Badge>
        </CardContent>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Permission</TableHead>
              <TableHead className="text-right">Access</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissionsList.map((permission) => (
              <TableRow key={permission}>
                <TableCell className="font-medium">{permission}</TableCell>
                <TableCell className="text-right">
                  <Checkbox
                    checked={localPermissions[permission] || false}
                    onCheckedChange={(checked) => handlePermissionChange(permission, !!checked)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
