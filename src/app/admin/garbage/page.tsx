"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

export default function ScannerEventsPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Default to last 7 days
    to: new Date(),
  });

  const {
    data: scanEvents,
    isLoading,
    error,
  } = api.scanEvent.getScanEvents.useQuery(
    {
      startDate: date?.from?.toISOString(),
      endDate: date?.to?.toISOString(),
    },
    {
      enabled: !!date?.from && !!date?.to, // Only run query when dates are available
    },
  );

  const handleDateSelect = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate);
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Scanner Events</h1>

        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !date && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={handleDateSelect}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive rounded-md p-4">
          Error loading scan events: {error.message}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product name</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scanner</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Latitude</TableHead>
                <TableHead>Longitude</TableHead>
                <TableHead>Scanned At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : scanEvents && scanEvents.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scanner</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Latitude</TableHead>
                <TableHead>Longitude</TableHead>
                <TableHead>Scanned At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scanEvents.map((event: any) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {event.product?.image && (
                        <img
                          src={event.product.image}
                          alt={event.product.name || "Product image"}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      )}
                      <span>{event.product?.name || "N/A"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{event.product?.manufacturer || "N/A"}</TableCell>
                  <TableCell>{event.product?.barcode || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {event.product?.type || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {event.scanner.firstname} {event.scanner.lastname}
                  </TableCell>
                  <TableCell>{event.location || "N/A"}</TableCell>
                  <TableCell>
                    {event.latitude ? event.latitude : "N/A"}
                  </TableCell>
                  <TableCell>
                    {event.longitude ? event.longitude : "N/A"}
                  </TableCell>
                  <TableCell>
                    {format(new Date(event.scannedAt), "MMM dd, yyyy HH:mm")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No scan events found for the selected date range.
          </p>
        </div>
      )}
    </div>
  );
}
