import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface CustomerListFilterProps {
  searchTerm: string;
  onSearch: (searchTerm: string) => void;
  onFilterChange: (filters: Record<string, any>) => void;
}

export const CustomerListFilterClone: React.FC<CustomerListFilterProps> = ({ searchTerm, onSearch }) => {
  const [search, setSearch] = useState(searchTerm || '');
  
  useEffect(() => {
    setSearch(searchTerm || '');
  }, [searchTerm]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
  };

  const handleSearchSubmit = () => {
    onSearch(search);
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="w-full">
        <Label htmlFor="search" className="sr-only">
          البحث في العقود...
        </Label>
        <div className="relative">
          <Input
            type="search"
            id="search"
            placeholder="البحث برقم العقد أو اسم العميل أو رقم السيارة..."
            value={search}
            onChange={handleSearchChange}
            className="pr-10 text-right"
            dir="rtl"
          />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            onClick={handleSearchSubmit}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full"
          >
            <Search className="h-4 w-4" />
            <span className="sr-only">بحث</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
