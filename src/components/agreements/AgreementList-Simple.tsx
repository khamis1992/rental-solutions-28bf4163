import React from 'react';
import { SimpleAgreement } from '@/types/common';
import { formatDate } from '@/lib/date-utils';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface AgreementListSimpleProps {
  agreements: SimpleAgreement[];
  onEdit?: (agreement: SimpleAgreement) => void;
  onDelete?: (agreement: SimpleAgreement) => void;
  onView?: (agreement: SimpleAgreement) => void;
}

const AgreementListSimple: React.FC<AgreementListSimpleProps> = ({
  agreements,
  onEdit,
  onDelete,
  onView
}) => {
  // Convert SimpleAgreement to Agreement for compatibility
  const convertToAgreement = (agreement: SimpleAgreement): SimpleAgreement => {
    return {
      ...agreement,
      start_date: agreement.start_date,
      end_date: agreement.end_date,
      created_at: agreement.created_at,
      updated_at: agreement.updated_at
    };
  };

  const convertedAgreements = agreements.map(convertToAgreement);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Agreement #</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Vehicle</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {convertedAgreements.map((agreement) => (
          <TableRow key={agreement.id}>
            <TableCell className="font-medium">{agreement.agreement_number || 'N/A'}</TableCell>
            <TableCell>{agreement.customer?.name || 'N/A'}</TableCell>
            <TableCell>{agreement.vehicle?.make} {agreement.vehicle?.model} ({agreement.vehicle?.year}) || N/A</TableCell>
            <TableCell>{formatDate(agreement.start_date)}</TableCell>
            <TableCell>{formatDate(agreement.end_date)}</TableCell>
            <TableCell>{agreement.status}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  {onView && (
                    <DropdownMenuItem onClick={() => onView(agreement)}>
                      View
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(agreement)}>
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem onClick={() => onDelete(agreement)}>
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default AgreementListSimple;
