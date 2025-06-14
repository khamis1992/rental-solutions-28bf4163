
import React from 'react';
import { Toggle } from '@/components/ui/toggle';
import { Grid, List, Table } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgreementViewSelectorsProps {
  viewMode: 'card' | 'table' | 'compact';
  setViewMode: (mode: 'card' | 'table' | 'compact') => void;
}

export function AgreementViewSelectors({ viewMode, setViewMode }: AgreementViewSelectorsProps) {
  return (
    <div className="flex items-center bg-muted rounded-md p-1">
      <Toggle
        pressed={viewMode === 'card'}
        onPressedChange={() => setViewMode('card')}
        size="sm"
        variant="outline"
        aria-label="Card view"
        className={cn(
          "rounded-l-md rounded-r-none border-r-0",
          viewMode === 'card' ? 'bg-background' : 'hover:bg-muted-foreground/10'
        )}
      >
        <Grid className="h-4 w-4" />
      </Toggle>
      <Toggle
        pressed={viewMode === 'table'}
        onPressedChange={() => setViewMode('table')}
        size="sm"
        variant="outline"
        aria-label="Table view"
        className={cn(
          "rounded-none border-x-0",
          viewMode === 'table' ? 'bg-background' : 'hover:bg-muted-foreground/10'
        )}
      >
        <Table className="h-4 w-4" />
      </Toggle>
      <Toggle
        pressed={viewMode === 'compact'}
        onPressedChange={() => setViewMode('compact')}
        size="sm"
        variant="outline"
        aria-label="Compact view"
        className={cn(
          "rounded-r-md rounded-l-none border-l-0",
          viewMode === 'compact' ? 'bg-background' : 'hover:bg-muted-foreground/10'
        )}
      >
        <List className="h-4 w-4" />
      </Toggle>
    </div>
  );
}
