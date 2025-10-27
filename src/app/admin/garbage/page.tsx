"use client";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, Loader2, Download, Search } from "lucide-react";
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
import { Input } from "~/components/ui/input";
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
  const [searchTerm, setSearchTerm] = useState<string>("");
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
    }
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
    }
  );
  const [scanEventsWithLocation, setScanEventsWithLocation] = useState<any[]>([]);
  const [manufacturerScanEventsWithLocation, setManufacturerScanEventsWithLocation] = useState<any[]>([]);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (scanEvents && scanEvents.length > 0) {
      const initialEvents = scanEvents.map((event) => ({
        ...event,
        location: null,
        locationLoading: false,
      }));
      setScanEventsWithLocation(initialEvents);
    }
  }, [scanEvents]);

  useEffect(() => {
    if (manufacturerScanEvents && manufacturerScanEvents.length > 0) {
      const initialEvents = manufacturerScanEvents.map((event) => ({
        ...event,
        location: null,
        locationLoading: false,
      }));
      setManufacturerScanEventsWithLocation(initialEvents);
    }
  }, [manufacturerScanEvents]);

  const loadLocationForEvent = async (event: any, setState: React.Dispatch<React.SetStateAction<any[]>>) => {
    if (!event.latitude || !event.longitude) return;

    setState((prev) =>
      prev.map((e) =>
        e.id === event.id ? { ...e, locationLoading: true } : e
      )
    );

    try {
      const location = await reverseGeocode(event.latitude, event.longitude);
      setState((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, location, locationLoading: false } : e
        )
      );
    } catch (err) {
      setState((prev) =>
        prev.map((e) =>
          e.id === event.id ? { ...e, locationLoading: false } : e
        )
      );
    }
  };

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
        return {
          id: manufacturer,
          manufacturer: manufacturer,
          totalQuantity: totalQty
        };
      })
      .filter(manufacturer =>
        manufacturer.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return result;
  };

  const getEventsByManufacturer = (manufacturer: string) => {
    const table1Events = scanEventsWithLocation.filter(
      event => event.product?.manufacturer === manufacturer
    );
    const table2Events = manufacturerScanEventsWithLocation.filter(
      event => event.manufacturer?.name === manufacturer
    );
    return [...table1Events, ...table2Events];
  };

  const handleDateSelect = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate);
  };

  const openGoogleMaps = (latitude: string, longitude: string) => {
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, "_blank");
  };

  const handleViewMore = (manufacturer: string) => {
    setSelectedManufacturer(manufacturer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedManufacturer(null);
  };

  const exportToCSV = (table: "table1" | "table2" | "table3") => {
    let data, filename;
    if (table === "table1") {
      data = scanEventsWithLocation.filter(event => event.product?.manufacturer && event.product.manufacturer !== "N/A");
      filename = "scan_events_table1.csv";
    } else if (table === "table2") {
      data = manufacturerScanEventsWithLocation.filter(event => event.manufacturer?.name && event.manufacturer.name !== "N/A");
      filename = "scan_events_table2.csv";
    } else {
      data = getCombinedManufacturerQuantities();
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
      csvContent += "Manufacturer,Total Quantity\n";
      data.forEach((event) => {
        const row = [
          `"${event.manufacturer}"`,
          event.totalQuantity,
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
    const searchMatch = searchTerm === "" ||
      event.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.product?.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.product?.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    return manufacturerMatch && scannerMatch && typeMatch && searchMatch && event.product?.manufacturer && event.product.manufacturer !== "N/A";
  });

  const filteredManufacturerScanEvents = manufacturerScanEventsWithLocation.filter((event) => {
    const manufacturerMatch = manufacturerFilter === "all" || event.manufacturer?.name?.toLowerCase() === manufacturerFilter.toLowerCase();
    const scannerMatch = scannerFilter === "all" || `${event.scanner.firstname} ${event.scanner.lastname}` === scannerFilter;
    const searchMatch = searchTerm === "" ||
      event.manufacturer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.manufacturer?.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    return manufacturerMatch && scannerMatch && searchMatch && event.manufacturer?.name && event.manufacturer.name !== "N/A";
  });

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products/manufacturers..."
            className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
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
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by manufacturer" />
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
        </div>
        <div className="flex items-center gap-2">
          <Select value={scannerFilter} onValueChange={setScannerFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by scanner" />
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
        </div>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
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
      </div>
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
                  <TableHead>Total Quantity</TableHead>
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
        ) : getCombinedManufacturerQuantities().length > 0 ? (
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
                  <TableHead>Total Quantity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getCombinedManufacturerQuantities().map((event: any) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {event.manufacturer}
                    </TableCell>
                    <TableCell className="font-bold">{event.totalQuantity}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewMore(event.manufacturer)}
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
              No manufacturer scan events found for the selected date range.
            </p>
          </div>
        )}
      </div>
      {/* Modal for Manufacturer Details */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[1000px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedManufacturer} Details</DialogTitle>
          </DialogHeader>
          {selectedManufacturer && (
            <div className="space-y-6 py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product/Manufacturer</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Scanner</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Scanned At</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getEventsByManufacturer(selectedManufacturer).map((event: any) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        {event.product?.name || event.manufacturer?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        {event.product?.barcode || event.manufacturer?.barcode || "N/A"}
                      </TableCell>
                      <TableCell>
                        {event.product?.type ? (
                          <Badge variant="outline">
                            {event.product.type}
                          </Badge>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {event.scanner.firstname} {event.scanner.lastname}
                      </TableCell>
                      <TableCell>
                        {event.quantity}
                      </TableCell>
                      <TableCell>
                        {format(new Date(event.scannedAt), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        {event.latitude && event.longitude ? (
                          event.locationLoading ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Loading location...</span>
                            </div>
                          ) : event.location ? (
                            <Button
                              variant="link"
                              className="p-0 h-auto text-blue-500 hover:underline"
                              onClick={() => openGoogleMaps(event.latitude, event.longitude)}
                            >
                              {event.location}
                            </Button>
                          ) : (
                            <Button
                              variant="link"
                              className="p-0 h-auto text-blue-500 hover:underline"
                              onClick={() => {
                                loadLocationForEvent(event, setScanEventsWithLocation);
                                loadLocationForEvent(event, setManufacturerScanEventsWithLocation);
                              }}
                            >
                              See location
                            </Button>
                          )
                        ) : (
                          <p>N/A</p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
