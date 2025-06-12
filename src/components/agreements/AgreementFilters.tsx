import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

interface AgreementFiltersProps {
  onApplyFilters: (filters: any) => void;
  onClearFilters: () => void;
  statuses: { label: string; value: string }[];
}

export function AgreementFilters({ onApplyFilters, onClearFilters, statuses }: AgreementFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const handleApplyFilters = () => {
    const filters = {
      searchTerm,
      status: selectedStatus,
    };
    onApplyFilters(filters);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    onClearFilters();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Agreement Filters</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <Input
              type="text"
              id="search"
              placeholder="Search by agreement number, customer, or vehicle"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select onValueChange={setSelectedStatus} defaultValue={selectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="ghost" onClick={handleClearFilters}>
            Clear
          </Button>
          <Button type="button" onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
