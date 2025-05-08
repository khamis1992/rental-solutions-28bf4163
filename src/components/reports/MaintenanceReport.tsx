import React, { useState, useEffect } from 'react';
import { useMaintenance } from '@/hooks/use-maintenance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Car, Wrench, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';

const MaintenanceReport = () => {
  const [vehicleId, setVehicleId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Pass vehicleId parameter to useMaintenance
  const { maintenanceRecords, isLoading } = useMaintenance(vehicleId);

  const [filteredRecords, setFilteredRecords] = useState(maintenanceRecords);

  useEffect(() => {
    setFilteredRecords(maintenanceRecords);
  }, [maintenanceRecords]);

  const handleSearch = () => {
    if (!vehicleId) {
      alert('Please enter a Vehicle ID');
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = maintenanceRecords.filter(record =>
      record.description?.toLowerCase().includes(term) ||
      record.status?.toLowerCase().includes(term) ||
      record.notes?.toLowerCase().includes(term)
    );
    setFilteredRecords(filtered);
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="flex items-center space-x-4">
        <Input
          type="text"
          placeholder="Enter Vehicle ID"
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
        />
        <Input
          type="text"
          placeholder="Search descriptions, status, and notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>

      {/* Maintenance Report */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Report</CardTitle>
          <CardDescription>
            {vehicleId ? `Showing maintenance records for Vehicle ID: ${vehicleId}` : 'Enter a Vehicle ID to view records'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-6">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading maintenance records...</p>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{formatDate(record.created_at)}</TableCell>
                        <TableCell>{record.description}</TableCell>
                        <TableCell>
                          <Badge className={record.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.notes}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        {vehicleId ? "No matching maintenance records found." : "Enter a Vehicle ID to view records"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenanceReport;
