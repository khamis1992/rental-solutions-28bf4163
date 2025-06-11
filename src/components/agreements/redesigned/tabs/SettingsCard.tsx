
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Agreement } from '@/types/agreement';
import { Settings, Edit, Trash } from 'lucide-react';

interface SettingsCardProps {
  agreement: Agreement;
  onEdit: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function SettingsCard({
  agreement,
  onEdit,
  onDelete
}: SettingsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Agreement Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2">Agreement Management</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Modify agreement details or permanently remove this agreement from the system.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Agreement
              </Button>
              <Button variant="destructive" onClick={onDelete}>
                <Trash className="h-4 w-4 mr-2" />
                Delete Agreement
              </Button>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-semibold text-amber-800 mb-2">Important Notice</h4>
            <p className="text-sm text-amber-700">
              Deleting this agreement will permanently remove all associated data including payments, 
              traffic fines, and legal cases. This action cannot be undone.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
