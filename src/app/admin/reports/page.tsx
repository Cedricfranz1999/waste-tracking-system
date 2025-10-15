"use client";

import { useState, useEffect } from "react";
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

// Define types for our data
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

  const [scanEventsWithLocation, setScanEventsWithLocation] = useState<ScanEvent[]>([]);

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

  const handleDateSelect = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate);
  };

  const handleExportCSV = () => {
    if (!scanEventsWithLocation.length) return;

    const headers = [
      "Product Name",
      "Manufacturer",
      "Barcode",
      "Type",
      "Scanner",
      "Scanner Email",
      "Location",
      "Latitude",
      "Longitude",
      "Quantity",
      "Scanned At",
    ];

    const csvData = scanEventsWithLocation.map((event) => [
      event.product?.name || "N/A",
      event.product?.manufacturer || "N/A",
      event.product?.barcode || "N/A",
      event.product?.type || "N/A",
      `${event.scanner.firstname} ${event.scanner.lastname}`,
      event.scanner.email,
      event.location || "N/A",
      event.latitude,
      event.longitude,
      event.quantity || "N/A",
      format(new Date(event.scannedAt as any), "yyyy-MM-dd HH:mm:ss"),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        row
          .map((field) => `"${field?.toString().replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `scan-reports-${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Aggregate scan events by product and sum quantities
  const aggregatedProductStats = scanEventsWithLocation.reduce((acc, event) => {
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

  // Aggregate scan events by product type and sum quantities
  const aggregatedTypeStats = scanEventsWithLocation.reduce((acc, event) => {
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

  // Aggregate scan events by location and sum quantities
  const aggregatedLocationStats = scanEventsWithLocation.reduce((acc, event) => {
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

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Scan Reports</h1>

        <div className="flex items-center space-x-2">
          <Button
            onClick={handleExportCSV}
            disabled={!scanEventsWithLocation.length}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

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
          Error loading reports: {error.message}
        </div>
      )}

      {/* Charts Section */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
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
                <BarChart data={reportData.scannerStats || []}>
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

          {/* Scans by Location (MODIFIED) */}
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

      {/* Data Table */}
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
                <TableHead>Scanner Email</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Latitude</TableHead>
                <TableHead>Longitude</TableHead>
                <TableHead>Quantity</TableHead>
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
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : scanEventsWithLocation.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scanner</TableHead>
                <TableHead>Scanner Email</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Latitude</TableHead>
                <TableHead>Longitude</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Scanned At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scanEventsWithLocation.map((event) => (
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
                  <TableCell>{event.scanner.email}</TableCell>
                  <TableCell>{event.location || "N/A"}</TableCell>
                  <TableCell>
                    {event.latitude ? event.latitude : "N/A"}
                  </TableCell>
                  <TableCell>
                    {event.longitude ? event.longitude : "N/A"}
                  </TableCell>
                  <TableCell>{event.quantity || "N/A"}</TableCell>
                  <TableCell>
                    {format(
                      new Date(event.scannedAt as any),
                      "MMM dd, yyyy HH:mm",
                    )}
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
