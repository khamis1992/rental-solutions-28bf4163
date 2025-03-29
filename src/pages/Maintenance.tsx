
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from '@tanstack/react-query';
import PageContainer from '@/components/layout/PageContainer';
import { Plus, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Maintenance() {
  const navigate = useNavigate();

  const { data: maintenanceRecords, isLoading } = useQuery({
    queryKey: ['maintenance'],
    queryFn: async () => {
      // TODO: Replace with actual API call
      return [
        {
          id: '1',
          vehicleId: '1',
          vehicleName: 'Toyota Camry',
          type: 'Scheduled',
          status: 'pending',
          dueDate: '2024-03-30',
          description: 'Regular maintenance check'
        }
      ];
    }
  });

  return (
    <PageContainer 
      title="Maintenance" 
      description="Track and manage vehicle maintenance"
      actions={
        <Button onClick={() => navigate('/maintenance/add')}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Maintenance
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25</div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {maintenanceRecords?.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.vehicleName}</TableCell>
                <TableCell>{record.type}</TableCell>
                <TableCell>
                  <Badge variant="outline">{record.status}</Badge>
                </TableCell>
                <TableCell>{new Date(record.dueDate).toLocaleDateString()}</TableCell>
                <TableCell>{record.description}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    onClick={() => navigate(`/maintenance/${record.id}`)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PageContainer>
  );
}
