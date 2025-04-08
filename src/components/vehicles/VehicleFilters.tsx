
import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { vehicleStatusOptions, vehicleTypeOptions, vehicleMakeOptions } from './vehicleFilterOptions';

const filterSchema = z.object({
  status: z.string().optional(),
  make: z.string().optional(),
  type: z.string().optional(),
  searchTerm: z.string().optional(),
});

type FilterValues = z.infer<typeof filterSchema>;

interface VehicleFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  clearFilters: () => void;
}

export function VehicleFilters({ onFilterChange, clearFilters }: VehicleFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const form = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      status: '',
      make: '',
      type: '',
      searchTerm: '',
    },
  });

  const handleSubmit = (values: FilterValues) => {
    onFilterChange(values);
  };

  const handleClearFilters = () => {
    form.reset({
      status: '',
      make: '',
      type: '',
      searchTerm: '',
    });
    clearFilters();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <FormField
            control={form.control}
            name="searchTerm"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Search</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by license plate, make, model..."
                      className="pl-8"
                      {...field}
                    />
                  </div>
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="mt-auto"
          >
            Search
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="mt-auto"
            onClick={handleClearFilters}
          >
            <X className="h-4 w-4 mr-2" /> Clear
          </Button>
        </div>

        {/* Advanced filters */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${expanded ? '' : 'hidden md:grid'}`}>
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={(value: string) => field.onChange(value)}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    {vehicleStatusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="make"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Make</FormLabel>
                <Select
                  onValueChange={(value: string) => field.onChange(value)}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="All Makes" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">All Makes</SelectItem>
                    {vehicleMakeOptions.map((make) => (
                      <SelectItem key={make.value} value={make.value}>
                        {make.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  onValueChange={(value: string) => field.onChange(value)}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    {vehicleTypeOptions.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
        
        {/* Expand/collapse button for mobile */}
        <div className="md:hidden">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Hide Advanced Filters" : "Show Advanced Filters"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default VehicleFilters;
