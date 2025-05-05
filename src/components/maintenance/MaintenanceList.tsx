import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { typeGuards } from '@/lib/database';

// Add missing types
interface MaintenanceListProps {
  maintenanceRecords?: any[];
  categories?: any[];
  isLoading?: boolean;
  onStatusChange?: (id: string, status: string) => Promise<void>;
}

const MaintenanceList: React.FC<MaintenanceListProps> = ({
  maintenanceRecords = [],
  categories = [],
  isLoading = false,
  onStatusChange
}) => {
  const navigate = useNavigate();
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState('all');

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleStatusChange = async (id: string, status: string) => {
    if (onStatusChange) {
      try {
        await onStatusChange(id, status);
      } catch (error) {
        console.error("Error changing status:", error);
      }
    }
  };

  const getCategoryName = (categoryId: string) => {
    if (!typeGuards.isArray(categories)) return 'Unknown';
    
    const category = categories.find(cat => cat?.id === categoryId);
    return category?.name || 'Unknown';
  };

  const filteredMaintenance = typeGuards.isArray(maintenanceRecords) 
    ? (filter === 'all' 
        ? maintenanceRecords 
        : maintenanceRecords.filter(record => record?.status === filter))
    : [];

  if (isLoading) {
    return <div>Loading maintenance records...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="space-x-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button 
            variant={filter === 'scheduled' ? 'default' : 'outline'} 
            onClick={() => setFilter('scheduled')}
          >
            Scheduled
          </Button>
          <Button 
            variant={filter === 'completed' ? 'default' : 'outline'} 
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
        </div>
        <Button onClick={() => navigate('/maintenance/add')}>
          Add Maintenance
        </Button>
      </div>

      {filteredMaintenance.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            No maintenance records found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMaintenance.map(record => (
            <Card key={record.id}>
              <CardContent className="grid grid-cols-4 gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{record.service_type}</h3>
                  <p className="text-sm text-muted-foreground">
                    Category: {getCategoryName(record.category_id)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Vehicle ID:</p>
                  <p className="text-muted-foreground">{record.vehicle_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Scheduled Date:</p>
                  <p className="text-muted-foreground">
                    {new Date(record.scheduled_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status:</p>
                  <div className="flex space-x-2">
                    <Button 
                      variant={record.status === 'scheduled' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(record.id, 'scheduled')}
                    >
                      Scheduled
                    </Button>
                    <Button
                      variant={record.status === 'completed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(record.id, 'completed')}
                    >
                      Completed
                    </Button>
                  </div>
                </div>
                <div className="col-span-4">
                  <Button variant="link" onClick={() => toggleExpand(record.id)}>
                    {expandedIds.includes(record.id) ? 'Hide Details' : 'Show Details'}
                  </Button>
                  {expandedIds.includes(record.id) && (
                    <div className="mt-4">
                      <p className="text-sm font-medium">Description:</p>
                      <p className="text-muted-foreground">{record.description}</p>
                      <p className="text-sm font-medium mt-2">Notes:</p>
                      <p className="text-muted-foreground">{record.notes}</p>
                      <p className="text-sm font-medium mt-2">Cost:</p>
                      <p className="text-muted-foreground">${record.cost}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MaintenanceList;
