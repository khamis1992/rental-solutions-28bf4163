
import React from 'react';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PaymentFilterBarProps {
  statusFilter: string | null;
  setStatusFilter: (status: string | null) => void;
}

export function PaymentFilterBar({ statusFilter, setStatusFilter }: PaymentFilterBarProps) {
  const getFilterLabel = () => {
    switch (statusFilter) {
      case 'completed':
        return 'Completed';
      case 'completed_ontime':
        return 'Paid On Time';
      case 'completed_late':
        return 'Paid Late';  
      case 'pending':
        return 'Pending';
      case 'overdue':
        return 'Overdue';
      default:
        return 'All Payments';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-2">
          <Filter className="h-4 w-4 mr-2" />
          {statusFilter ? getFilterLabel() : "Filter"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuCheckboxItem 
          checked={statusFilter === null}
          onCheckedChange={() => setStatusFilter(null)}
        >
          All Payments
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem 
          checked={statusFilter === 'completed_ontime'}
          onCheckedChange={() => setStatusFilter('completed_ontime')}
        >
          Paid On Time
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem 
          checked={statusFilter === 'completed_late'}
          onCheckedChange={() => setStatusFilter('completed_late')}
        >
          Paid Late
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem 
          checked={statusFilter === 'pending'}
          onCheckedChange={() => setStatusFilter('pending')}
        >
          Pending
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem 
          checked={statusFilter === 'overdue'}
          onCheckedChange={() => setStatusFilter('overdue')}
        >
          Overdue
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
