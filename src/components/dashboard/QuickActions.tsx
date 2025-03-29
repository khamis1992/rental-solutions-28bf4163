
import { Plus, Car, FileText, Settings, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
        <Car className="h-6 w-6 mb-2" />
        <span>New Rental</span>
      </Button>
      <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
        <Calendar className="h-6 w-6 mb-2" />
        <span>Schedule</span>
      </Button>
      <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
        <FileText className="h-6 w-6 mb-2" />
        <span>Reports</span>
      </Button>
      <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
        <Settings className="h-6 w-6 mb-2" />
        <span>Settings</span>
      </Button>
    </div>
  );
}
