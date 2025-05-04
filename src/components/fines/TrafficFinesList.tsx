
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { TrafficFine } from '@/types/traffic-fine';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';

export function TrafficFinesList() {
  const [trafficFines, setTrafficFines] = useState<TrafficFine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  const fetchTrafficFines = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('traffic_fines')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (debouncedSearch) {
        query = query.or(`license_plate.ilike.%${debouncedSearch}%,violation_number.ilike.%${debouncedSearch}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Type assertion to handle supabase result type
      setTrafficFines(data as TrafficFine[]);
    } catch (error: any) {
      console.error('Error fetching traffic fines:', error);
      toast.error('Failed to load traffic fines', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Update when search query changes
  useEffect(() => {
    fetchTrafficFines();
  }, [debouncedSearch]);

  const handleDeleteFine = async (fineId: string) => {
    try {
      const { error } = await supabase
        .from('traffic_fines')
        .delete()
        .eq('id', fineId);

      if (error) throw error;
      
      // Remove from UI state
      setTrafficFines(trafficFines.filter(fine => fine.id !== fineId));
      toast.success('Traffic fine deleted successfully');
    } catch (error: any) {
      console.error('Error deleting traffic fine:', error);
      toast.error('Failed to delete traffic fine', {
        description: error.message
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Traffic Fines</CardTitle>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fines..."
                className="w-[200px] pl-8 md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>License Plate</TableHead>
              <TableHead>Violation No.</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading traffic fines...
                </TableCell>
              </TableRow>
            ) : trafficFines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No traffic fines found
                </TableCell>
              </TableRow>
            ) : (
              trafficFines.map((fine) => (
                <TableRow key={fine.id}>
                  <TableCell>{fine.license_plate}</TableCell>
                  <TableCell>{fine.violation_number || 'N/A'}</TableCell>
                  <TableCell>
                    {fine.violation_date ? new Date(fine.violation_date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>{fine.fine_amount ? `QAR ${fine.fine_amount.toFixed(2)}` : 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={fine.payment_status === 'paid' ? 'success' : 'destructive'}>
                      {fine.payment_status || 'Unpaid'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteFine(fine.id as string)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default TrafficFinesList;
