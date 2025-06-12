
import { ColumnDef } from '@tanstack/react-table';
import { Agreement } from '@/types/agreement';

export const createAgreementColumns = (): ColumnDef<Agreement>[] => [
  {
    accessorKey: 'agreement_number',
    header: 'Agreement #',
  },
  {
    accessorKey: 'customer_name',
    header: 'Customer',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'start_date',
    header: 'Start Date',
  },
  {
    accessorKey: 'end_date',
    header: 'End Date',
  },
  {
    accessorKey: 'rent_amount',
    header: 'Rent Amount',
  },
];
