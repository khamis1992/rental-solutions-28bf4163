
import React from 'react';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge'; 
import { ValidationResultType } from './types';

export interface ValidationResult extends ValidationResultType {}

interface ValidationHistoryProps {
  validationHistory: ValidationResult[];
  isLoading?: boolean;
}

export function ValidationHistory({ validationHistory, isLoading = false }: ValidationHistoryProps) {
  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading validation history...</div>;
  }

  if (!validationHistory || validationHistory.length === 0) {
    return <div className="text-sm text-muted-foreground">No validation history found.</div>;
  }

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Validation History</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>License Plate</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Result</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {validationHistory.map((item, index) => (
            <TableRow key={item.validationId || index}>
              <TableCell>{item.licensePlate}</TableCell>
              <TableCell>{item.validationDate ? format(new Date(item.validationDate), 'dd MMM yyyy HH:mm') : 'N/A'}</TableCell>
              <TableCell>{item.validationSource || 'System'}</TableCell>
              <TableCell>
                {item.hasFine ? (
                  <Badge variant="destructive">Has Fine</Badge>
                ) : (
                  <Badge variant="outline" className="bg-green-100">No Fine</Badge>
                )}
              </TableCell>
              <TableCell className="max-w-xs truncate">{item.details || 'No details'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
