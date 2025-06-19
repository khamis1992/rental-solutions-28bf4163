
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Agreement } from '@/types/agreement';
import { Settings, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface SettingsCardProps {
  agreement: Agreement;
  onEdit: () => void;
  onDelete: () => void;
}

export function SettingsCard({
  agreement,
  onEdit,
  onDelete
}: SettingsCardProps) {
  const createdAt = agreement.created_at instanceof Date ? agreement.created_at : new Date(agreement.created_at);
  const updatedAt = agreement.updated_at instanceof Date ? agreement.updated_at : new Date(agreement.updated_at);

  return (
    <div className="space-y-6">
      {/* Agreement Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Agreement Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onEdit} className="flex-1">
              <Edit className="h-4 w-4 mr-2" />
              Edit Agreement
            </Button>
            <Button 
              variant="destructive" 
              onClick={onDelete}
              className="flex-1"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Agreement
            </Button>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-amber-800">Important Notice</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Deleting an agreement is permanent and cannot be undone. All associated payments, 
                  documents, and history will be removed.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agreement Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Agreement Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">{format(createdAt, "PPP 'at' p")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Modified</p>
              <p className="font-medium">{format(updatedAt, "PPP 'at' p")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Agreement ID</p>
              <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                {agreement.id}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Agreement Type</p>
              <p className="font-medium capitalize">
                {agreement.agreement_type?.replace('_', ' ') || 'Standard'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• All changes are automatically saved</p>
            <p>• Payment history is preserved across edits</p>
            <p>• Documents are linked to this agreement permanently</p>
            <p>• Audit logs track all modifications</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
