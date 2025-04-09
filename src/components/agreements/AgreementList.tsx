import React, { useState, useEffect } from 'react';
import { useAgreements } from '@/hooks/use-agreements';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AgreementStatus } from '@/lib/validation-schemas/agreement';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"

const AgreementList = () => {
  const { useList, deleteAgreement } = useAgreements();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AgreementStatus | ''>('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [onAgreementDeleted, setOnAgreementDeleted] = useState<() => void | undefined>(undefined);
  const { data: agreements, isLoading } = useList();

  useEffect(() => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      setSearch(formattedDate);
    } else {
      setSearch('');
    }
  }, [date]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as AgreementStatus | '');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAgreement(id); // Changed from deleteAgreement.mutateAsync
      toast.success("Agreement deleted successfully");
      setOnAgreementDeleted?.();
    } catch (error) {
      console.error("Error deleting agreement:", error);
      toast.error(`Failed to delete agreement: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const filteredAgreements = agreements?.filter(agreement => {
    const searchTerm = search.toLowerCase();
    const agreementNumber = agreement.agreement_number?.toLowerCase() || '';
    const customerName = agreement.customers?.full_name?.toLowerCase() || '';
    const vehiclePlate = agreement.vehicles?.license_plate?.toLowerCase() || '';

    const matchesSearch =
      agreementNumber.includes(searchTerm) ||
      customerName.includes(searchTerm) ||
      vehiclePlate.includes(searchTerm);

    const matchesStatus = statusFilter ? agreement.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Agreements</h2>
        <Link to="/agreements/add">
          <Button>Add Agreement</Button>
        </Link>
      </div>

      <div className="flex space-x-4 mb-4">
        <Input
          type="text"
          placeholder="Search agreements..."
          value={search}
          onChange={handleSearchChange}
        />

        <select
          className="border rounded px-2 py-1"
          value={statusFilter}
          onChange={handleStatusFilterChange}
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
          <option value="closed">Closed</option>
        </select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[200px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <Table>
        <TableCaption>A list of your agreements.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Agreement #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">Loading agreements...</TableCell>
            </TableRow>
          ) : filteredAgreements && filteredAgreements.length > 0 ? (
            filteredAgreements.map(agreement => (
              <TableRow key={agreement.id}>
                <TableCell className="font-medium"><Link to={`/agreements/${agreement.id}`}>{agreement.agreement_number}</Link></TableCell>
                <TableCell>{agreement.customers?.full_name}</TableCell>
                <TableCell>{agreement.vehicles?.license_plate}</TableCell>
                <TableCell>{agreement.start_date ? format(new Date(agreement.start_date), 'yyyy-MM-dd') : 'N/A'}</TableCell>
                <TableCell>{agreement.end_date ? format(new Date(agreement.end_date), 'yyyy-MM-dd') : 'N/A'}</TableCell>
                <TableCell>{agreement.status}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(agreement.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center">No agreements found.</TableCell>
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={7} className="text-center">
              Total agreements: {filteredAgreements ? filteredAgreements.length : 0}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default AgreementList;
