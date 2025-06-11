
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Edit, Trash2, AlertTriangle } from 'lucide-react';

interface SettingsCardProps {
  agreement?: any;
  onEdit: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function SettingsCard({
  agreement,
  onEdit,
  onDelete
}: SettingsCardProps) {
  const handleEdit = async () => {
    await onEdit();
  };

  const handleDelete = async () => {
    await onDelete();
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Agreement Settings
        </CardTitle>
        <Badge variant="secondary">
          Agreement ID: {agreement?.id || 'Unknown'}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="border rounded-md p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Edit Agreement</h3>
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
            <p className="text-muted-foreground text-xs mt-2">
              Modify agreement details such as dates, amounts, and other settings.
            </p>
          </div>

          <div className="border rounded-md p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Delete Agreement</h3>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
            <p className="text-muted-foreground text-xs mt-2">
              Permanently remove this agreement from the system.
            </p>
          </div>

          <div className="border rounded-md p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-amber-500">Potential Issues</h3>
              <Badge variant="secondary">
                <AlertTriangle className="h-4 w-4 mr-2" />
                2 Issues
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs mt-2">
              Review and resolve any potential issues with this agreement.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
