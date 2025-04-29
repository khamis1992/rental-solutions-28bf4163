import React from 'react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { FileCheck, FileEdit, FileClock, FileText, FileX, Car } from 'lucide-react';
import { Agreement } from '@/types/agreement';

interface AgreementRowProps {
  agreement: any; // Accept any, as mapped agreements may have extra fields
  onDelete: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
}

const AgreementRow: React.FC<AgreementRowProps> = ({ agreement, onDelete, isSelected, onSelect }) => {
  // Support both Agreement and mapped agreement with customers/vehicles fields
  const customer = agreement.customers || agreement.customer;
  const vehicle = agreement.vehicles || agreement.vehicle;
  const status = agreement.status as string;
  return (
    <TableRow>
      <TableCell>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={e => onSelect(agreement.id, e.target.checked)}
        />
      </TableCell>
      <TableCell>
        <Link to={`/agreements/${agreement.id}`} className="font-medium text-primary hover:underline">
          {agreement.agreement_number}
        </Link>
      </TableCell>
      <TableCell>
        {customer && customer.id ? (
          <Link to={`/customers/${customer.id}`} className="hover:underline">
            {customer.full_name || 'N/A'}
          </Link>
        ) : 'N/A'}
      </TableCell>
      <TableCell>
        {vehicle && vehicle.id ? (
          <Link to={`/vehicles/${vehicle.id}`} className="hover:underline">
            {vehicle.make && vehicle.model ? (
              <span>{vehicle.make} {vehicle.model} <span className="font-semibold text-primary ml-1">({vehicle.license_plate})</span></span>
            ) : vehicle.license_plate ? (
              <span>Vehicle: <span className="font-semibold text-primary">{vehicle.license_plate}</span></span>
            ) : 'N/A'}
          </Link>
        ) : agreement.vehicle_id ? (
          <Link to={`/vehicles/${agreement.vehicle_id}`} className="hover:underline text-amber-600">
            Vehicle ID: {agreement.vehicle_id}
          </Link>
        ) : 'N/A'}
      </TableCell>
      <TableCell>
        {format(new Date(agreement.start_date), 'MMM d, yyyy')} - {format(new Date(agreement.end_date), 'MMM d, yyyy')}
      </TableCell>
      <TableCell>
        <span className="font-medium">{formatCurrency(agreement.rent_amount || 0)}</span>
      </TableCell>
      <TableCell>
        <Badge className="capitalize">
          {status === 'active' ? <FileCheck className="h-3 w-3 mr-1" /> : null}
          {status === 'draft' ? <FileEdit className="h-3 w-3 mr-1" /> : null}
          {status === 'pending' ? <FileClock className="h-3 w-3 mr-1" /> : null}
          {status === 'completed' ? <FileCheck className="h-3 w-3 mr-1" /> : null}
          {status === 'terminated' ? <FileX className="h-3 w-3 mr-1" /> : null}
          {status === 'pending_payment' ? <FileClock className="h-3 w-3 mr-1" /> : null}
          {status === 'pending_deposit' ? <FileClock className="h-3 w-3 mr-1" /> : null}
          {status === 'archived' ? <FileText className="h-3 w-3 mr-1" /> : null}
          {status === 'closed' ? <FileText className="h-3 w-3 mr-1" /> : null}
          {status}
        </Badge>
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="sm" onClick={() => onDelete(agreement.id)}>
          Delete
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default React.memo(AgreementRow);
