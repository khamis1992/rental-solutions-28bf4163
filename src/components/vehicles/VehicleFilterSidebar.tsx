
import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface VehicleFilterSidebarProps {
  onFilterChange: (filters: any) => void;
  className?: string;
}

export function VehicleFilterSidebar({ onFilterChange, className }: VehicleFilterSidebarProps) {
  const [minPrice, setMinPrice] = React.useState(20);
  const [maxPrice, setMaxPrice] = React.useState(100);
  
  return (
    <div className={cn("w-72 flex-shrink-0 border-r p-6 space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filter by:</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-primary"
        >
          Reset all <X className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label>Rental Type</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">Per Day</Button>
            <Button variant="outline" size="sm" className="flex-1">Per Hour</Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Available now only</Label>
            <Switch />
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="price-range">
            <AccordionTrigger>Price Range / Day</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="h-24 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 rounded-lg"></div>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    className="w-24"
                  />
                  <span>to</span>
                  <Input 
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-24"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="car-brand">
            <AccordionTrigger>Car Brand</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes'].map((brand) => (
                  <div key={brand} className="flex items-center space-x-2">
                    <Checkbox id={brand} />
                    <label
                      htmlFor={brand}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {brand}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="body-type">
            <AccordionTrigger>Body Type</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {['Sedan', 'Hatchback', 'SUV', 'Crossover', 'Van'].map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox id={type} />
                    <label
                      htmlFor={type}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="transmission">
            <AccordionTrigger>Transmission</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {['Automatic', 'Manual'].map((transmission) => (
                  <div key={transmission} className="flex items-center space-x-2">
                    <Checkbox id={transmission} />
                    <label
                      htmlFor={transmission}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {transmission}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="fuel-type">
            <AccordionTrigger>Fuel Type</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map((fuel) => (
                  <div key={fuel} className="flex items-center space-x-2">
                    <Checkbox id={fuel} />
                    <label
                      htmlFor={fuel}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {fuel}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
