
import React, { useEffect, useState } from 'react';
import { Vehicle } from '@/types/vehicle';
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Calendar, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  service_type: string;
  description?: string;
  scheduled_date: string;
  completed_date?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  cost?: number;
}

interface MaintenanceTabProps {
  vehicle: Vehicle;
}

const MaintenanceTab = ({ vehicle }: MaintenanceTabProps) => {
  const navigate = useNavigate();
  
  // Fetch maintenance records for this vehicle
  const { data: maintenanceRecords, isLoading, error } = useQuery({
    queryKey: ['maintenance', 'vehicle', vehicle.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .order('scheduled_date', { ascending: false });
        
      if (error) throw error;
      return data as MaintenanceRecord[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline">Scheduled</Badge>;
      case 'in_progress':
        return <Badge variant="warning">In Progress</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <CardContent>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Maintenance Records</h3>
        <Button 
          size="sm" 
          onClick={() => navigate(`/maintenance/add`, { state: { vehicleId: vehicle.id } })}
        >
          <Calendar className="h-4 w-4 mr-2" /> 
          Schedule Maintenance
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : error ? (
        <div className="bg-destructive/10 p-4 rounded-md text-destructive flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
          <div>
            <p className="font-medium">Error loading maintenance records</p>
            <p className="text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        </div>
      ) : maintenanceRecords && maintenanceRecords.length > 0 ? (
        <div className="space-y-4">
          {maintenanceRecords.map((record) => (
            <div 
              key={record.id}
              className="border rounded-md p-4 hover:bg-muted/50 transition-colors"
              onClick={() => navigate(`/maintenance/${record.id}`)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Wrench className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="font-medium">{record.service_type}</span>
                </div>
                {getStatusBadge(record.status)}
              </div>
              <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                {record.description || 'No description provided'}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span>
                  Scheduled: {format(new Date(record.scheduled_date), 'PPP')}
                </span>
                {record.completed_date && (
                  <span>
                    Completed: {format(new Date(record.completed_date), 'PPP')}
                  </span>
                )}
                {record.cost && (
                  <span className="font-medium">
                    Cost: ${record.cost.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/10">
          <Wrench className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
          <h4 className="text-lg font-medium mb-2">No maintenance records</h4>
          <p className="text-muted-foreground mb-4">There are no maintenance records for this vehicle.</p>
          <Button 
            variant="outline"
            onClick={() => navigate(`/maintenance/add`, { state: { vehicleId: vehicle.id } })}
          >
            Schedule Maintenance
          </Button>
        </div>
      )}
    </CardContent>
  );
};

export default MaintenanceTab;
