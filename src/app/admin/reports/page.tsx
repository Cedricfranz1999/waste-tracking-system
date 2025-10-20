"use client";
import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, Download } from "lucide-react";
import { Calendar } from "~/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { api } from "~/trpc/react";
import { safeDecode } from "~/utils/string";
import { reverseGeocode } from "~/utils/geolocation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface Scanner {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
}
interface Product {
  id: string;
  name: string | null;
  barcode: string;
  manufacturer: string;
  type: string;
  image: string | null;
}
interface ScanEvent {
  id: string;
  scanner: Scanner;
  product: Product | null;
  location: string | null;
  latitude: string;
  longitude: string;
  quantity: number | null;
  scannedAt: Date;
}
interface ReportData {
  scanEvents: ScanEvent[];
  scannerStats: { scannerId: string; scannerName: string; count: number }[];
  productStats: { productId: string; productName: string; count: number }[];
  locationStats: { location: string; count: number }[];
  typeStats: { type: string; count: number }[];
}
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

export default function ReportsPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [scannerFilter, setScannerFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  const {
    data: reportData,
    isLoading,
    error,
  } = api.reports.getReports.useQuery(
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

  const [scanEventsWithLocation, setScanEventsWithLocation] = useState<ScanEvent[]>([]);
  const [manufacturerScanEventsWithLocation, setManufacturerScanEventsWithLocation] = useState<any[]>([]);

  useEffect(() => {
    if (reportData?.scanEvents) {
      const fetchLocations = async () => {
        const eventsWithLocation = await Promise.all(
          reportData.scanEvents.map(async (event) => {
            if (event.latitude && event.longitude) {
              const location = await reverseGeocode(event.latitude, event.longitude);
              return { ...event, location };
            }
            return event;
          }),
        );
        setScanEventsWithLocation(eventsWithLocation as any);
      };
      fetchLocations();
    }
  }, [reportData]);

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

  const handleDateSelect = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate);
  };

  // Filtered data
  const filteredScanEvents = useMemo(() => {
    return scanEventsWithLocation.filter((event) => {
      const matchesManufacturer =
        manufacturerFilter === "all" ||
        event.product?.manufacturer?.toLowerCase() === manufacturerFilter.toLowerCase();
      const matchesType =
        typeFilter === "all" ||
        event.product?.type?.toLowerCase() === typeFilter.toLowerCase();
      const matchesScanner =
        scannerFilter === "all" ||
        `${event.scanner.firstname} ${event.scanner.lastname}`.toLowerCase() === scannerFilter.toLowerCase();
      const matchesLocation =
        locationFilter === "all" ||
        event.location?.toLowerCase() === locationFilter.toLowerCase();
      return matchesManufacturer && matchesType && matchesScanner && matchesLocation;
    });
  }, [scanEventsWithLocation, manufacturerFilter, typeFilter, scannerFilter, locationFilter]);

  // Filtered manufacturer data
  const filteredManufacturerScanEvents = useMemo(() => {
    return manufacturerScanEventsWithLocation.filter((event) => {
      const matchesManufacturer =
        manufacturerFilter === "all" ||
        event.manufacturer?.name?.toLowerCase() === manufacturerFilter.toLowerCase();
      const matchesType =
        typeFilter === "all" ||
        event.product?.type?.toLowerCase() === typeFilter.toLowerCase();
      const matchesScanner =
        scannerFilter === "all" ||
        `${event.scanner.firstname} ${event.scanner.lastname}`.toLowerCase() === scannerFilter.toLowerCase();
      const matchesLocation =
        locationFilter === "all" ||
        event.location?.toLowerCase() === locationFilter.toLowerCase();
      return matchesManufacturer && matchesType && matchesScanner && matchesLocation;
    });
  }, [manufacturerScanEventsWithLocation, manufacturerFilter, typeFilter, scannerFilter, locationFilter]);

  // Aggregate scan events by product and sum quantities
  const aggregatedProductStats = useMemo(() => {
    return filteredScanEvents.reduce((acc, event) => {
      if (!event.product) return acc;
      const productName = event.product.name || "Unknown";
      const existingProduct = acc.find((item) => item.productName === productName);
      if (existingProduct) {
        existingProduct.count += event.quantity || 0;
      } else {
        acc.push({
          productName: productName,
          count: event.quantity || 0,
        });
      }
      return acc;
    }, [] as { productName: string; count: number }[]);
  }, [filteredScanEvents]);

  // Aggregate scan events by product type and sum quantities
  const aggregatedTypeStats = useMemo(() => {
    return filteredScanEvents.reduce((acc, event) => {
      if (!event.product) return acc;
      const productType = event.product.type || "Unknown";
      const existingType = acc.find((item) => item.type === productType);
      if (existingType) {
        existingType.count += event.quantity || 0;
      } else {
        acc.push({
          type: productType,
          count: event.quantity || 0,
        });
      }
      return acc;
    }, [] as { type: string; count: number }[]);
  }, [filteredScanEvents]);

  // Aggregate scan events by location and sum quantities
  const aggregatedLocationStats = useMemo(() => {
    return filteredScanEvents.reduce((acc, event) => {
      const location = event.location || "Unknown";
      const existingLocation = acc.find((item) => item.location === location);
      if (existingLocation) {
        existingLocation.count += event.quantity || 0;
      } else {
        acc.push({
          location: location,
          count: event.quantity || 0,
        });
      }
      return acc;
    }, [] as { location: string; count: number }[]);
  }, [filteredScanEvents]);

  // Aggregate scan events by scanner and sum quantities
  const aggregatedScannerStats = useMemo(() => {
    return filteredScanEvents.reduce((acc, event) => {
      const scannerName = `${event.scanner.firstname} ${event.scanner.lastname}`;
      const existingScanner = acc.find((item) => item.scannerName === scannerName);
      if (existingScanner) {
        existingScanner.count += event.quantity || 0;
      } else {
        acc.push({
          scannerName: scannerName,
          count: event.quantity || 0,
        });
      }
      return acc;
    }, [] as { scannerName: string; count: number }[]);
  }, [filteredScanEvents]);

  // Calculate total quantities from scanEventsWithLocation grouped by manufacturer
  const getScanEventsQuantitiesByManufacturer = useMemo(() => {
    const quantities: Record<string, number> = {};
    filteredScanEvents.forEach((event) => {
      const manufacturer = event.product?.manufacturer;
      if (manufacturer) {
        quantities[manufacturer] = (quantities[manufacturer] || 0) + (event.quantity || 0);
      }
    });
    return quantities;
  }, [filteredScanEvents]);

  // Calculate total quantities from manufacturerScanEventsWithLocation grouped by manufacturer
  const getTable2QuantitiesByManufacturer = useMemo(() => {
    const quantities: Record<string, number> = {};
    filteredManufacturerScanEvents.forEach((event) => {
      const manufacturer = event.manufacturer?.name;
      if (manufacturer) {
        quantities[manufacturer] = (quantities[manufacturer] || 0) + (event.quantity || 0);
      }
    });
    return quantities;
  }, [filteredManufacturerScanEvents]);

  // Get all unique manufacturers
  const getAllManufacturers = useMemo(() => {
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
  }, [scanEventsWithLocation, manufacturerScanEventsWithLocation]);

  // Get all unique types
  const getAllTypes = useMemo(() => {
    const table1Types = scanEventsWithLocation
      .map(event => event.product?.type)
      .filter(type => type && type !== "N/A");
    const table2Types = manufacturerScanEventsWithLocation
      .map(event => event.product?.type)
      .filter(type => type && type !== "N/A");
    const allTypes = [...new Set([...table1Types, ...table2Types])];
    return allTypes;
  }, [scanEventsWithLocation, manufacturerScanEventsWithLocation]);

  // Get all unique scanners
  const getAllScanners = useMemo(() => {
    const table1Scanners = scanEventsWithLocation
      .map(event => `${event.scanner.firstname} ${event.scanner.lastname}`)
      .filter(Boolean);
    const table2Scanners = manufacturerScanEventsWithLocation
      .map(event => `${event.scanner.firstname} ${event.scanner.lastname}`)
      .filter(Boolean);
    const allScanners = [...new Set([...table1Scanners, ...table2Scanners])];
    return allScanners;
  }, [scanEventsWithLocation, manufacturerScanEventsWithLocation]);

  // Get all unique locations
  const getAllLocations = useMemo(() => {
    const table1Locations = scanEventsWithLocation
      .map(event => event.location)
      .filter(location => location && location !== "N/A");
    const table2Locations = manufacturerScanEventsWithLocation
      .map(event => event.location)
      .filter(location => location && location !== "N/A");
    const allLocations = [...new Set([...table1Locations, ...table2Locations])];
    return allLocations;
  }, [scanEventsWithLocation, manufacturerScanEventsWithLocation]);

  // Combine quantities from both tables
  const getCombinedManufacturerQuantities = useMemo(() => {
    const table1Quantities = getScanEventsQuantitiesByManufacturer;
    const table2Quantities = getTable2QuantitiesByManufacturer;
    const allManufacturers = getAllManufacturers;
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
          manufacturer: manufacturer,
          totalQuantity: totalQty
        };
      });
    return result.sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [getScanEventsQuantitiesByManufacturer, getTable2QuantitiesByManufacturer, getAllManufacturers, manufacturerFilter]);

  // Export to CSV
  const exportToCSV = () => {
    const data = getCombinedManufacturerQuantities;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Manufacturer,Total Quantity\n";
    data.forEach((event) => {
      const row = [
        `"${event.manufacturer || "N/A"}"`,
        event.totalQuantity,
      ].join(",");
      csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "top_manufacturers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Scan Reports</h1>
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
      {error && (
        <div className="bg-destructive/15 text-destructive rounded-md p-4">
          Error loading reports: {error.message}
        </div>
      )}
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select onValueChange={setManufacturerFilter} value={manufacturerFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Manufacturer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Manufacturers</SelectItem>
            {getAllManufacturers.map((manufacturer) => (
              <SelectItem key={manufacturer} value={manufacturer}>
                {manufacturer}
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
            {getAllTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
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
            {getAllScanners.map((scanner) => (
              <SelectItem key={scanner} value={scanner}>
                {scanner}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={setLocationFilter} value={locationFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {getAllLocations.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Charts Section */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reportData ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Scans by Scanner */}
          <Card>
            <CardHeader>
              <CardTitle>Scans by Scanner</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={aggregatedScannerStats || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="scannerName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          {/* Scans by Product Type */}
          <Card>
            <CardHeader>
              <CardTitle>Scans by Product Type</CardTitle>
            </CardHeader>
            <CardContent>
              {aggregatedTypeStats?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={aggregatedTypeStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="type"
                      label={({ name, count }: any) => {
                        const total = aggregatedTypeStats.reduce(
                          (sum: number, item: any) => sum + item.count,
                          0,
                        );
                        const percentage = ((count / total) * 100).toFixed(0);
                        return `${name}: ${percentage}%`;
                      }}
                    >
                      {aggregatedTypeStats.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-muted-foreground">
                    No type data available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Top Scanned Manufacturer (Graph) */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Top Scanned Manufacturer</CardTitle>
            </CardHeader>
            <CardContent>
              {manufacturerError && (
                <div className="bg-destructive/15 text-destructive rounded-md p-4 mb-4">
                  Error loading manufacturer data: {manufacturerError.message}
                </div>
              )}
              {isManufacturerLoading ? (
                <div className="rounded-md border">
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : getCombinedManufacturerQuantities.length > 0 ? (
                <div className="rounded-md border">
                  <div className="flex justify-end p-2">
                   
                  </div>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={getCombinedManufacturerQuantities}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="manufacturer" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="totalQuantity" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-muted-foreground">No manufacturer data available</p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Scanned Products</CardTitle>
            </CardHeader>
            <CardContent>
              {aggregatedProductStats?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={aggregatedProductStats}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="productName"
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-muted-foreground">No product data available</p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Scans by Location */}
          <Card>
            <CardHeader>
              <CardTitle>Scans by Location</CardTitle>
            </CardHeader>
            <CardContent>
              {aggregatedLocationStats?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={aggregatedLocationStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="location" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-64 items-center justify-center">
                  <p className="text-muted-foreground">No location data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
