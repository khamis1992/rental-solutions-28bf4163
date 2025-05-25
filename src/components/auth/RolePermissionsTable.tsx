import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Permission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

interface Permissions {
  [resource: string]: Permission;
}

export function RolePermissionsTable() {
  const [permissions, setPermissions] = useState<Permissions>({});
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*');

      if (error) {
        console.error('Error fetching permissions:', error);
        return;
      }

      const initialPermissions: Permissions = {};
      data.forEach((item) => {
        initialPermissions[item.resource] = {
          view: item.view,
          create: item.create,
          edit: item.edit,
          delete: item.delete,
        };
      });

      setPermissions(initialPermissions);
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = async (resource: string, action: keyof Permission, checked: boolean) => {
    setPermissions((prevPermissions) => ({
      ...prevPermissions,
      [resource]: {
        ...prevPermissions[resource],
        [action]: checked,
      },
    }));

    try {
      const { error } = await supabase
        .from('role_permissions')
        .upsert([
          {
            resource: resource,
            view: permissions[resource]?.view || false,
            create: permissions[resource]?.create || false,
            edit: permissions[resource]?.edit || false,
            delete: permissions[resource]?.delete || false,
            [action]: checked,
          },
        ]);

      if (error) {
        console.error('Error updating permission:', error);
      }
    } catch (error) {
      console.error('Error updating permission:', error);
    }
  };

  return (
    <div className="space-y-4">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Resource
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              View
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Create
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Edit
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Delete
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Object.entries(permissions).map(([resource, permission]) => (
            <tr key={resource} className="border-b">
              <td className="py-2 px-4 font-medium">{resource}</td>
              <td className="py-2 px-4">
                <input
                  type="checkbox"
                  checked={permission.view || false}
                  onChange={(e) => updatePermission(resource, 'view', e.target.checked)}
                />
              </td>
              <td className="py-2 px-4">
                <input
                  type="checkbox"
                  checked={permission.create || false}
                  onChange={(e) => updatePermission(resource, 'create', e.target.checked)}
                />
              </td>
              <td className="py-2 px-4">
                <input
                  type="checkbox"
                  checked={permission.edit || false}
                  onChange={(e) => updatePermission(resource, 'edit', e.target.checked)}
                />
              </td>
              <td className="py-2 px-4">
                <input
                  type="checkbox"
                  checked={permission.delete || false}
                  onChange={(e) => updatePermission(resource, 'delete', e.target.checked)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
