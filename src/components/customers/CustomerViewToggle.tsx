
import React from 'react';
import { Button } from '@/components/ui/button';
import { Grid3X3, List } from 'lucide-react';

interface CustomerViewToggleProps {
  view: 'grid' | 'table';
  onViewChange: (view: 'grid' | 'table') => void;
}

export const CustomerViewToggle: React.FC<CustomerViewToggleProps> = ({
  view,
  onViewChange
}) => {
  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      <Button
        variant={view === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('grid')}
        className="flex items-center gap-2"
      >
        <Grid3X3 className="h-4 w-4" />
        بطاقات
      </Button>
      <Button
        variant={view === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('table')}
        className="flex items-center gap-2"
      >
        <List className="h-4 w-4" />
        جدول
      </Button>
    </div>
  );
};
