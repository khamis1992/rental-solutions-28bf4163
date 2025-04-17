import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

// Define MaintenanceType enum to match the expected types
export enum MaintenanceType {
  REGULAR_INSPECTION = "REGULAR_INSPECTION",
  REPAIR = "REPAIR",
  OTHER = "OTHER"
}

export function MaintenanceSchedulingWizard() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Fix the initial state types
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>(MaintenanceType.REGULAR_INSPECTION);
  const [cost, setCost] = useState<number>(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Maintenance</CardTitle>
        <CardDescription>
          Schedule a maintenance for a vehicle.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="maintenance-type">Maintenance Type</Label>
            <Select onValueChange={(value) => setMaintenanceType(value as MaintenanceType)}>
              <SelectTrigger id="maintenance-type">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={MaintenanceType.REGULAR_INSPECTION}>Regular Inspection</SelectItem>
                <SelectItem value={MaintenanceType.REPAIR}>Repair</SelectItem>
                <SelectItem value={MaintenanceType.OTHER}>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="cost">Cost</Label>
            <Input type="number" id="cost" placeholder="0.00" value={cost} onChange={(e) => setCost(Number(e.target.value))} />
          </div>
        </div>
        <div>
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) =>
                  date < new Date()
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button>Schedule Maintenance</Button>
      </CardContent>
    </Card>
  )
}
