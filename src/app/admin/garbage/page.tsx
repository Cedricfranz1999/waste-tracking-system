"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, Loader2, Download } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";
import { reverseGeocode } from "~/utils/geolocation";

export default function ScannerEventsPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("all");
  const [scannerFilter, setScannerFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
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
      enabled: !!date?.from && !!date?.to,
    },
  );
  const {
    data: manufacturerScanEvents,
    isLoading: isManufacturerLoading,
    error: manufacturerError,
  } = api.scanEvent.getScanEventsByManufacturer.useQuery(
    {
      startDate: date?.from?.toISOString(),
      endDate: date?.to?.toISOString(),
    },
    {
      enabled: !!date?.from && !!date?.to,
    },
  );
  const [scanEventsWithLocation, setScanEventsWithLocation] = useState<any[]>([]);
  const [manufacturerScanEventsWithLocation, setManufacturerScanEventsWithLocation] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (scanEvents && scanEvents.length > 0) {
      const initialEvents = scanEvents.map((event) => ({
        ...event,
        locationLoading: !!event.latitude && !!event.longitude,
        location: null,
      }));
      setScanEventsWithLocation(initialEvents);
      initialEvents.forEach(async (event: any) => {
        if (event.latitude && event.longitude) {
          try {
            const location = await reverseGeocode(event.latitude, event.longitude);
            setScanEventsWithLocation((prev) =>
              prev.map((e) =>
                e.id === event.id ? { ...e, location, locationLoading: false } : e
              )
            );
          } catch (err) {
            setScanEventsWithLocation((prev) =>
              prev.map((e) =>
                e.id === event.id ? { ...e, locationLoading: false } : e
              )
            );
          }
        } else {
          setScanEventsWithLocation((prev) =>
            prev.map((e) =>
              e.id === event.id ? { ...e, locationLoading: false } : e
            )
          );
        }
      });
    }
  }, [scanEvents]);

  useEffect(() => {
    if (manufacturerScanEvents && manufacturerScanEvents.length > 0) {
      const initialEvents = manufacturerScanEvents.map((event) => ({
        ...event,
        locationLoading: !!event.latitude && !!event.longitude,
        location: null,
      }));
      setManufacturerScanEventsWithLocation(initialEvents);
      initialEvents.forEach(async (event: any) => {
        if (event.latitude && event.longitude) {
          try {
            const location = await reverseGeocode(event.latitude, event.longitude);
            setManufacturerScanEventsWithLocation((prev) =>
              prev.map((e) =>
                e.id === event.id ? { ...e, location, locationLoading: false } : e
              )
            );
          } catch (err) {
            setManufacturerScanEventsWithLocation((prev) =>
              prev.map((e) =>
                e.id === event.id ? { ...e, locationLoading: false } : e
              )
            );
          }
        } else {
          setManufacturerScanEventsWithLocation((prev) =>
            prev.map((e) =>
              e.id === event.id ? { ...e, locationLoading: false } : e
            )
          );
        }
      });
    }
  }, [manufacturerScanEvents]);

  const getTable1QuantitiesByManufacturer = () => {
    if (!scanEventsWithLocation.length) return {};
    const quantities: Record<string, number> = {};
    scanEventsWithLocation.forEach((event) => {
      const manufacturer = event.product?.manufacturer;
      if (manufacturer && manufacturer !== "N/A") {
        quantities[manufacturer] = (quantities[manufacturer] || 0) + (event.quantity || 0);
      }
    });
    return quantities;
  };

  const getTable2QuantitiesByManufacturer = () => {
    if (!manufacturerScanEventsWithLocation.length) return {};
    const quantities: Record<string, number> = {};
    manufacturerScanEventsWithLocation.forEach((event) => {
      const manufacturer = event.manufacturer?.name;
      if (manufacturer && manufacturer !== "N/A") {
        quantities[manufacturer] = (quantities[manufacturer] || 0) + (event.quantity || 0);
      }
    });
    return quantities;
  };

  const getAllManufacturers = () => {
    const table1Manufacturers = scanEventsWithLocation
      .map(event => event.product?.manufacturer)
      .filter(manufacturer => manufacturer && manufacturer !== "N/A");
    const table2Manufacturers = manufacturerScanEventsWithLocation
      .map(event => event.manufacturer?.name)
      .filter(manufacturer => manufacturer && manufacturer !== "N/A");
    const allManufacturers = [...new Set([...table1Manufacturers, ...table2Manufacturers])];
    const uniqueManufacturersMap = new Map();
    allManufacturers.forEach(manufacturer => {
      const normalized = manufacturer.toLowerCase();
      if (!uniqueManufacturersMap.has(normalized)) {
        uniqueManufacturersMap.set(normalized, manufacturer);
      }
    });
    return Array.from(uniqueManufacturersMap.values());
  };

  const getAllScanners = () => {
    const table1Scanners = scanEventsWithLocation
      .map(event => `${event.scanner.firstname} ${event.scanner.lastname}`)
      .filter(Boolean);
    const table2Scanners = manufacturerScanEventsWithLocation
      .map(event => `${event.scanner.firstname} ${event.scanner.lastname}`)
      .filter(Boolean);
    const allScanners = [...new Set([...table1Scanners, ...table2Scanners])];
    return allScanners;
  };

  const getAllTypes = () => {
    const types = scanEventsWithLocation
      .map(event => event.product?.type)
      .filter(Boolean);
    const allTypes = [...new Set(types)];
    return allTypes;
  };

  const getCombinedManufacturerQuantities = () => {
    const table1Quantities = getTable1QuantitiesByManufacturer();
    const table2Quantities = getTable2QuantitiesByManufacturer();
    const allManufacturers = getAllManufacturers();
    if (allManufacturers.length === 0) return [];
    const result = allManufacturers
      .filter(manufacturer =>
        manufacturerFilter === "all" ||
        manufacturer.toLowerCase() === manufacturerFilter.toLowerCase()
      )
      .map((manufacturer) => {
        const table1Qty = table1Quantities[manufacturer] || 0;
        const table2Qty = table2Quantities[manufacturer] || 0;
        const totalQty = table1Qty + table2Qty;
        const sampleEventFromTable1 = scanEventsWithLocation.find(
          event => event.product?.manufacturer === manufacturer
        );
        const sampleEventFromTable2 = manufacturerScanEventsWithLocation.find(
          event => event.manufacturer?.name === manufacturer
        );
        const sampleEvent = sampleEventFromTable2 || sampleEventFromTable1;
        return {
          id: manufacturer,
          manufacturer: manufacturer,
          barcode: sampleEvent?.manufacturer?.barcode || sampleEvent?.product?.barcode || "N/A",
          scanner: sampleEvent?.scanner || { firstname: "N/A", lastname: "" },
          table1Quantity: table1Qty,
          table2Quantity: table2Qty,
          totalQuantity: totalQty
        };
      });
    return result;
  };

  const handleDateSelect = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate);
  };

  const openGoogleMaps = (latitude: string, longitude: string) => {
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, "_blank");
  };

  const handleViewMore = (event: any) => {
    setSelectedEventId(event.id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEventId(null);
  };

  const selectedEvent = [...scanEventsWithLocation, ...manufacturerScanEventsWithLocation].find(
    (event) => event.id === selectedEventId
  );

  const exportToCSV = (table: "table1" | "table2" | "table3") => {
    let data, filename;
    if (table === "table1") {
      data = scanEventsWithLocation.filter(event => event.product?.manufacturer && event.product.manufacturer !== "N/A");
      filename = "scan_events_table1.csv";
    } else if (table === "table2") {
      data = manufacturerScanEventsWithLocation.filter(event => event.manufacturer?.name && event.manufacturer.name !== "N/A");
      filename = "scan_events_table2.csv";
    } else {
      data = manufacturerScanEventsWithLocation.filter(event => event.manufacturer?.name && event.manufacturer.name !== "N/A");
      filename = "scan_events_table3.csv";
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    if (table === "table1") {
      csvContent += "Product,Manufacturer,Barcode,Type,Scanner,Quantity,Scanned At,Latitude,Longitude,Location\n";
      data.forEach((event) => {
        const row = [
          `"${event.product?.name || "N/A"}"`,
          `"${event.product?.manufacturer || "N/A"}"`,
          `"${event.product?.barcode || "N/A"}"`,
          `"${event.product?.type || "N/A"}"`,
          `"${event.scanner.firstname} ${event.scanner.lastname}"`,
          event.quantity,
          `"${format(new Date(event.scannedAt), "MMM dd, yyyy HH:mm")}"`,
          event.latitude || "N/A",
          event.longitude || "N/A",
          `"${event.location || "N/A"}"`,
        ].join(",");
        csvContent += row + "\n";
      });
    } else if (table === "table2") {
      csvContent += "Manufacturer,Barcode,Scanner,Quantity,Scanned At,Latitude,Longitude,Location\n";
      data.forEach((event) => {
        const row = [
          `"${event.manufacturer?.name || "N/A"}"`,
          `"${event.manufacturer?.barcode || "N/A"}"`,
          `"${event.scanner.firstname} ${event.scanner.lastname}"`,
          event.quantity,
          `"${format(new Date(event.scannedAt), "MMM dd, yyyy HH:mm")}"`,
          event.latitude || "N/A",
          event.longitude || "N/A",
          `"${event.location || "N/A"}"`,
        ].join(",");
        csvContent += row + "\n";
      });
    } else {
      csvContent += "Manufacturer,Barcode,Scanner,Quantity,Scanned At,Latitude,Longitude,Location\n";
      data.forEach((event) => {
        const row = [
          `"${event.manufacturer?.name || "N/A"}"`,
          `"${event.manufacturer?.barcode || "N/A"}"`,
          `"${event.scanner.firstname} ${event.scanner.lastname}"`,
          event.quantity,
          `"${format(new Date(event.scannedAt), "MMM dd, yyyy HH:mm")}"`,
          event.latitude || "N/A",
          event.longitude || "N/A",
          `"${event.location || "N/A"}"`,
        ].join(",");
        csvContent += row + "\n";
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredScanEvents = scanEventsWithLocation.filter((event) => {
    const manufacturerMatch = manufacturerFilter === "all" || event.product?.manufacturer?.toLowerCase() === manufacturerFilter.toLowerCase();
    const scannerMatch = scannerFilter === "all" || `${event.scanner.firstname} ${event.scanner.lastname}` === scannerFilter;
    const typeMatch = typeFilter === "all" || event.product?.type === typeFilter;
    return manufacturerMatch && scannerMatch && typeMatch && event.product?.manufacturer && event.product.manufacturer !== "N/A";
  });

  const filteredManufacturerScanEvents = manufacturerScanEventsWithLocation.filter((event) => {
    const manufacturerMatch = manufacturerFilter === "all" || event.manufacturer?.name?.toLowerCase() === manufacturerFilter.toLowerCase();
    const scannerMatch = scannerFilter === "all" || `${event.scanner.firstname} ${event.scanner.lastname}` === scannerFilter;
    return manufacturerMatch && scannerMatch && event.manufacturer?.name && event.manufacturer.name !== "N/A";
  });

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

      {/* Filters */}
      <div className="flex space-x-4">
        <Select onValueChange={setManufacturerFilter} value={manufacturerFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Manufacturer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Manufacturers</SelectItem>
            {getAllManufacturers().map((manufacturer) => (
              <SelectItem key={manufacturer} value={manufacturer}>
                {manufacturer}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={setScannerFilter} value={scannerFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Scanner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scanners</SelectItem>
            {getAllScanners().map((scanner) => (
              <SelectItem key={scanner} value={scanner}>
                {scanner}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={setTypeFilter} value={typeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {getAllTypes().map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Scanner Events Table */}
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
                <TableHead>Product</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scanner</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Actions</TableHead>
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
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : filteredScanEvents.length > 0 ? (
        <div className="rounded-md border">
          <div className="flex justify-end p-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV("table1")}
              className="gap-1"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scanner</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredScanEvents.map((event: any) => (
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
                  <TableCell>{event.product?.manufacturer}</TableCell>
                  <TableCell>{event.product?.barcode || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {event.product?.type || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {event.scanner.firstname} {event.scanner.lastname}
                  </TableCell>
                  <TableCell>{event.quantity}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewMore(event)}
                    >
                      View More
                    </Button>
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

      {/* Manufacturer Scan Events Table */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Manufacturer Scan Events</h2>
        {manufacturerError && (
          <div className="bg-destructive/15 text-destructive rounded-md p-4">
            Error loading manufacturer scan events: {manufacturerError.message}
          </div>
        )}
        {isManufacturerLoading ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Scanned At</TableHead>
                  <TableHead>Actions</TableHead>
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
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : filteredManufacturerScanEvents.length > 0 ? (
          <div className="rounded-md border">
            <div className="flex justify-end p-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV("table3")}
                className="gap-1"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Scanner</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Scanned At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredManufacturerScanEvents.map((event: any) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {event.manufacturer?.name}
                    </TableCell>
                    <TableCell>
                      {event.scanner.firstname} {event.scanner.lastname}
                    </TableCell>
                    <TableCell>{event.quantity}</TableCell>
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
              No manufacturer scan events found for the selected date range.
            </p>
          </div>
        )}
      </div>

      {/* Scan by Manufacturer Total Table */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Scan by Manufacturer Total</h2>
        {manufacturerError && (
          <div className="bg-destructive/15 text-destructive rounded-md p-4">
            Error loading manufacturer scan events: {manufacturerError.message}
          </div>
        )}
        {isManufacturerLoading ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Scanner</TableHead>
                  <TableHead>Total Quantity</TableHead>
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
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : getCombinedManufacturerQuantities().length > 0 ? (
          <div className="rounded-md border">
            <div className="flex justify-end p-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV("table2")}
                className="gap-1"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Total Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getCombinedManufacturerQuantities().map((event: any) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {event.manufacturer}
                    </TableCell>
                    <TableCell className="font-bold">{event.totalQuantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              No manufacturer scan events found for the selected date range.
            </p>
          </div>
        )}
      </div>

      {/* Modal for Event Details */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[1000px]">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-6 py-4">
              {selectedEvent.product ? (
                <div className="flex items-center gap-4">
                  {selectedEvent.product?.image && (
                    <img
                      src={selectedEvent.product.image}
                      alt={selectedEvent.product.name || "Product image"}
                      className="h-16 w-16 rounded-md object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium">{selectedEvent.product?.name || "N/A"}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.product?.manufacturer || "N/A"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{selectedEvent.manufacturer?.name || "N/A"}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.manufacturer?.barcode || "N/A"}
                    </p>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Barcode</p>
                  <p>
                    {selectedEvent.product?.barcode ||
                      selectedEvent.manufacturer?.barcode ||
                      "N/A"}
                  </p>
                </div>
                {selectedEvent.product && (
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p>
                      <Badge variant="outline">
                        {selectedEvent.product?.type || "N/A"}
                      </Badge>
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Scanner</p>
                  <p>
                    {selectedEvent.scanner.firstname} {selectedEvent.scanner.lastname}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p>{selectedEvent.quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  {selectedEvent.latitude && selectedEvent.longitude ? (
                    selectedEvent.locationLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading location...</span>
                      </div>
                    ) : (
                      <Button
                        variant="link"
                        className="p-0 h-auto text-blue-500 hover:underline"
                        onClick={() =>
                          openGoogleMaps(selectedEvent.latitude, selectedEvent.longitude)
                        }
                      >
                        {selectedEvent.location || "View on map"}
                      </Button>
                    )
                  ) : (
                    <p>{selectedEvent.location || "N/A"}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Latitude</p>
                  <p>{selectedEvent.latitude || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Longitude</p>
                  <p>{selectedEvent.longitude || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Scanned At</p>
                  <p>
                    {format(new Date(selectedEvent.scannedAt), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
