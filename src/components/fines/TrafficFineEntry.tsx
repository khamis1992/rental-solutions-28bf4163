
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTrafficFines } from "@/hooks/use-traffic-fines";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { TrafficFineCreatePayload } from "@/hooks/use-traffic-fines";

interface TrafficFineEntryProps {
  onFineSaved?: () => void;
}

const TrafficFineEntry = ({ onFineSaved }: TrafficFineEntryProps) => {
  const { createTrafficFine } = useTrafficFines();
  const [loading, setLoading] = useState(false);

  const fineSchema = z.object({
    violationNumber: z.string().min(1, "Required"),
    licensePlate: z.string().min(1, "Required"),
    violationDate: z.date({
      required_error: "Please select a date",
    }),
    fineAmount: z.coerce
      .number()
      .min(0.01, "Amount must be greater than 0")
      .refine((amount) => !isNaN(amount), {
        message: "Must be a valid number",
      }),
    violationCharge: z.string().optional(),
    location: z.string().optional(),
  });

  const form = useForm<z.infer<typeof fineSchema>>({
    resolver: zodResolver(fineSchema),
    defaultValues: {
      violationNumber: "",
      licensePlate: "",
      violationCharge: "",
      location: "",
      fineAmount: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof fineSchema>) => {
    setLoading(true);
    try {
      // Ensure all required fields are present and properly typed
      const payload: TrafficFineCreatePayload = {
        violationNumber: values.violationNumber,
        licensePlate: values.licensePlate,
        violationDate: values.violationDate,
        fineAmount: values.fineAmount,
        violationCharge: values.violationCharge || undefined,
        location: values.location || undefined,
        paymentStatus: 'pending'
      };

      await createTrafficFine(payload);

      // Reset form on successful save
      form.reset();

      toast.success("Traffic fine recorded successfully");
      
      if (onFineSaved) {
        onFineSaved();
      }
    } catch (error) {
      console.error("Error creating traffic fine:", error);
      toast.error("Failed to create traffic fine", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record New Traffic Fine</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="violationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Violation Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter violation number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="licensePlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Plate</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter license plate" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="violationDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Violation Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("2000-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fineAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter fine amount"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? undefined : Number(value));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="violationCharge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Violation Charge</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter violation type (optional)"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter location (optional)"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Record Fine"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TrafficFineEntry;
