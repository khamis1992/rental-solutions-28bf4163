
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CustomButton } from '@/components/ui/custom-button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, ClipboardCheck, FileEdit, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAgreements } from '@/hooks/use-agreements';
import { AgreementStatus } from '@/types/agreement';

// Helper function to format dates
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy');
  } catch (e) {
    return dateString;
  }
};

// Status badge styles by status type
const getStatusStyles = (status: AgreementStatus) => {
  switch (status) {
    case 'active':
      return { variant: 'default', className: 'bg-green-500 hover:bg-green-600' };
    case 'completed':
      return { variant: 'secondary' };
    case 'pending':
      return { variant: 'outline', className: 'border-blue-500 text-blue-500' };
    case 'cancelled':
      return { variant: 'destructive' };
    case 'overdue':
      return { variant: 'destructive', className: 'bg-orange-500 hover:bg-orange-600' };
    default:
      return { variant: 'outline' };
  }
};

const AgreementList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<{ status?: AgreementStatus; search?: string }>({});
  
  const { useList, useDelete } = useAgreements();
  const { data: agreements, isLoading, refetch } = useList(filters);
  const deleteMutation = useDelete();

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      // Note: Basic search is handled client-side here
      // For a production app, this would be handled by the server
      setFilters(prev => ({ ...prev, search: e.target.value }));
    } else {
      const { search, ...rest } = filters;
      setFilters(rest);
    }
  };

  // Handle status filter
  const handleStatusFilter = (status: AgreementStatus | 'all') => {
    if (status === 'all') {
      const { status, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters(prev => ({ ...prev, status }));
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this rental agreement?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  // Filter agreements by search term (client-side)
  const filteredAgreements = agreements?.filter(agreement => {
    if (!filters.search) return true;
    
    const searchTerm = filters.search.toLowerCase();
    const customer = `${agreement.customer?.first_name} ${agreement.customer?.last_name}`.toLowerCase();
    const vehicle = `${agreement.vehicle?.make} ${agreement.vehicle?.model}`.toLowerCase();
    
    return customer.includes(searchTerm) || 
           vehicle.includes(searchTerm) || 
           agreement.vehicle?.license_plate.toLowerCase().includes(searchTerm);
  });

  return (
    <Card className="shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-2xl font-bold">Rental Agreements</CardTitle>
        <CustomButton 
          onClick={() => navigate('/agreements/add')} 
          className="flex items-center gap-1" 
          glossy
        >
          <Plus className="h-4 w-4" /> New Agreement
        </CustomButton>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-2">
              <Select 
                onValueChange={(value) => handleStatusFilter(value as AgreementStatus | 'all')} 
                defaultValue="all"
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                placeholder="Search by customer or vehicle"
                className="w-full sm:w-[250px]"
                onChange={handleSearch}
              />
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => refetch()} 
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Rental Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Loading agreements...
                    </TableCell>
                  </TableRow>
                ) : filteredAgreements?.length ? (
                  filteredAgreements.map((agreement) => {
                    const status = agreement.status as AgreementStatus;
                    const statusStyle = getStatusStyles(status);
                    
                    return (
                      <TableRow key={agreement.id}>
                        <TableCell>
                          {agreement.customer ? (
                            <div className="font-medium">
                              {agreement.customer.first_name} {agreement.customer.last_name}
                            </div>
                          ) : 'Unknown Customer'}
                        </TableCell>
                        <TableCell>
                          {agreement.vehicle ? (
                            <>
                              <div className="font-medium">
                                {agreement.vehicle.make} {agreement.vehicle.model} ({agreement.vehicle.year})
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {agreement.vehicle.license_plate}
                              </div>
                            </>
                          ) : 'Unknown Vehicle'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>
                              {formatDate(agreement.start_date)} to {formatDate(agreement.end_date)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusStyle.variant as any} className={statusStyle.className}>
                            <Clock className="h-3 w-3 mr-1" />
                            <span className="capitalize">{status.replace('_', ' ')}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          ${agreement.total_cost.toFixed(2)}
                        </TableCell>
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
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => navigate(`/agreements/${agreement.id}`)}>
                                <ClipboardCheck className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/agreements/edit/${agreement.id}`)}>
                                <FileEdit className="h-4 w-4 mr-2" />
                                Edit Agreement
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDelete(agreement.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Agreement
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No rental agreements found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgreementList;
