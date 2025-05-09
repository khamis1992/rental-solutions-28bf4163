
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';
import { Edit, Trash, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MaintenanceRecord } from '@/types/maintenance';
import { toast } from 'sonner';

interface MaintenanceListProps {
  maintenanceRecords: unknown[];
  isLoading: boolean;
  onDelete?: (id: string) => void;
  categories?: any[];
}

// Create a type guard for maintenance records
function isMaintenanceRecord(record: unknown): record is MaintenanceRecord {
  return (
    typeof record === 'object' && 
    record !== null && 
    'id' in record &&
    typeof (record as any).id === 'string'
  );
}

// Create a type guard for category objects
function isCategory(item: unknown): item is { id: string; name: string } {
  return (
    typeof item === 'object' && 
    item !== null && 
    'id' in item &&
    'name' in item &&
    typeof (item as any).id === 'string' &&
    typeof (item as any).name === 'string'
  );
}

const MaintenanceList: React.FC<MaintenanceListProps> = ({ 
  maintenanceRecords, 
  isLoading,
  onDelete,
  categories = []
}) => {
  const navigate = useNavigate();

  // Function to get category name by ID
  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'N/A';
    
    const category = categories.find(c => isCategory(c) && c.id === categoryId);
    return category && isCategory(category) ? category.name : 'Unknown';
  };

  // Handle view maintenance details
  const handleView = (id: string) => {
    navigate(`/maintenance/${id}`);
  };

  // Handle edit maintenance
  const handleEdit = (id: string) => {
    navigate(`/maintenance/${id}/edit`);
  };

  // Handle delete maintenance
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this maintenance record?')) {
      if (onDelete) {
        onDelete(id);
        toast.success('Maintenance record deleted successfully');
      }
    }
  };

  // Render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    
    switch (status) {
      case 'scheduled':
        variant = "secondary";
        break;
      case 'in_progress':
        variant = "default";
        break;
      case 'completed':
        variant = "outline";
        break;
      case 'cancelled':
        variant = "destructive";
        break;
      default:
        variant = "default";
    }
    
    return <Badge variant={variant}>{status}</Badge>;
  };

  if (isLoading) {
    return <div>Loading maintenance records...</div>;
  }

  if (!maintenanceRecords || maintenanceRecords.length === 0) {
    return <div className="text-center p-4">No maintenance records found.</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Scheduled Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {maintenanceRecords.map((record) => {
            // Type guard to ensure we have a proper maintenance record
            if (!isMaintenanceRecord(record)) {
              return null; // Skip rendering for invalid records
            }
            
            return (
              <TableRow key={record.id}>
                <TableCell>{record.service_type || 'N/A'}</TableCell>
                <TableCell>{record.category_id ? getCategoryName(record.category_id) : 'N/A'}</TableCell>
                <TableCell>
                  {record.vehicle_id ? (
                    <Button variant="link" onClick={() => navigate(`/vehicles/${record.vehicle_id}`)}>
                      View Vehicle
                    </Button>
                  ) : 'N/A'}
                </TableCell>
                <TableCell>
                  {record.scheduled_date ? formatDate(record.scheduled_date) : 'N/A'}
                </TableCell>
                <TableCell>{renderStatusBadge(record.status || 'unknown')}</TableCell>
                <TableCell>
                  {record.status === 'completed' ? (
                    <Button variant="link" onClick={() => handleView(record.id)}>
                      View Details
                    </Button>
                  ) : (
                    <Button variant="link" onClick={() => handleEdit(record.id)}>
                      Edit Record
                    </Button>
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={record.description || ''}>
                  {record.description || 'N/A'}
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={record.notes || ''}>
                  {record.notes || 'N/A'}
                </TableCell>
                <TableCell className="font-medium">${record.cost?.toFixed(2) || '0.00'}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleView(record.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(record.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(record.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default MaintenanceList;
