
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MaintenanceRecord } from '@/hooks/use-maintenance';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ChevronDown, ChevronUp, Edit, Trash } from 'lucide-react';
import { format } from 'date-fns';

interface MaintenanceTableProps {
  records: MaintenanceRecord[];
  isLoading?: boolean;
  onEdit?: (record: MaintenanceRecord) => void;
  onDelete?: (id: string) => void;
}

const MaintenanceTable = ({
  records,
  isLoading = false,
  onEdit,
  onDelete
}: MaintenanceTableProps) => {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    if (expandedIds.includes(id)) {
      setExpandedIds(expandedIds.filter(item => item !== id));
    } else {
      setExpandedIds([...expandedIds, id]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Scheduled</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM d, yyyy');
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-12 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No maintenance records found.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service Type</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Scheduled Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <React.Fragment key={record.id}>
              <TableRow className="cursor-pointer" onClick={() => toggleExpand(record.id)}>
                <TableCell className="font-medium">{record.service_type}</TableCell>
                <TableCell>
                  {record.vehicle_id ? 
                    record.vehicle_id.substring(0, 6) + '...' : 
                    'Unknown'}
                </TableCell>
                <TableCell>{formatDate(record.scheduled_date)}</TableCell>
                <TableCell>{getStatusBadge(record.status || '')}</TableCell>
                <TableCell>
                  {record.cost ? `$${record.cost.toFixed(2)}` : 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center space-x-2">
                    {onEdit && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(record);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(record.id);
                        }}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                    {expandedIds.includes(record.id) ? 
                      <ChevronUp className="h-4 w-4" /> : 
                      <ChevronDown className="h-4 w-4" />
                    }
                  </div>
                </TableCell>
              </TableRow>
              {expandedIds.includes(record.id) && (
                <TableRow>
                  <TableCell colSpan={6} className="bg-gray-50">
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Details</h4>
                          <p className="text-sm"><span className="font-medium">Maintenance Type:</span> {record.maintenance_type || 'N/A'}</p>
                          <p className="text-sm"><span className="font-medium">Vehicle ID:</span> {record.vehicle_id}</p>
                          <p className="text-sm"><span className="font-medium">Cost:</span> {record.cost ? `$${record.cost.toFixed(2)}` : 'N/A'}</p>
                          <p className="text-sm"><span className="font-medium">Performed By:</span> {record.performed_by || 'N/A'}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Dates</h4>
                          <p className="text-sm"><span className="font-medium">Scheduled Date:</span> {formatDate(record.scheduled_date)}</p>
                          <p className="text-sm"><span className="font-medium">Completed Date:</span> {formatDate(record.completed_date)}</p>
                          <p className="text-sm"><span className="font-medium">Created At:</span> {formatDate(record.created_at)}</p>
                          <p className="text-sm"><span className="font-medium">Updated At:</span> {formatDate(record.updated_at)}</p>
                        </div>
                      </div>
                      
                      {record.description && (
                        <div className="mt-4">
                          <h4 className="font-semibold mb-2">Description</h4>
                          <p className="text-sm whitespace-pre-wrap">{record.description}</p>
                        </div>
                      )}
                      
                      {record.notes && (
                        <div className="mt-4">
                          <h4 className="font-semibold mb-2">Notes</h4>
                          <p className="text-sm whitespace-pre-wrap">{record.notes}</p>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MaintenanceTable;
