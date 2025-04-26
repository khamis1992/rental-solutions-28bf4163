
import React from 'react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Loader } from "@/components/ui/loader";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomerInfo } from "@/types/customer";

interface CustomerSearchCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerSelect: (customer: CustomerInfo) => void;
  customers: CustomerInfo[];
  isLoading?: boolean;
}

export function CustomerSearchCommandPalette({
  isOpen,
  onClose,
  onCustomerSelect,
  customers,
  isLoading = false,
}: CustomerSearchCommandPaletteProps) {
  const [search, setSearch] = React.useState("");

  const filteredCustomers = React.useMemo(() => {
    if (!search) return customers;

    const searchLower = search.toLowerCase();
    return customers.filter((customer) => {
      return (
        customer.full_name?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone_number?.toLowerCase().includes(searchLower) ||
        customer.driver_license?.toLowerCase().includes(searchLower)
      );
    });
  }, [customers, search]);

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <Command className="rounded-lg border shadow-md">
        <CommandInput 
          placeholder="Search customers by name, email, phone..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? (
              <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                <Loader className="h-4 w-4 animate-spin" />
                Loading customers...
              </div>
            ) : (
              "No customers found."
            )}
          </CommandEmpty>
          <CommandGroup heading="Available Customers">
            {filteredCustomers.map((customer) => (
              <CommandItem
                key={customer.id}
                onSelect={() => {
                  onCustomerSelect(customer);
                  onClose();
                }}
                className="flex items-center justify-between py-3"
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {customer.full_name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {customer.email}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {customer.phone_number}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
