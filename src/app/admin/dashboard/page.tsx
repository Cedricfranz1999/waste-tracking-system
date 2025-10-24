"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Package,
  QrCode,
  CheckCircle,
  Calendar,
  RefreshCw,
  Globe,
  Home,
  ShieldCheck,
} from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";

export default function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    data: counts,
    isLoading,
    refetch,
  } = api.dashboard.getCounts.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="mt-2 h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      {/* New Summary Card */}
      <Card className="mb-6 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Scan Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            {
              icon: <Home className="h-5 w-5 text-blue-500" />,
              label: "Local Products",
              value: counts?.localProducts || 0,
              color: "bg-blue-50 hover:bg-blue-100",
            },
            {
              icon: <Globe className="h-5 w-5 text-green-500" />,
              label: "International Products",
              value: counts?.internationalProducts || 0,
              color: "bg-green-50 hover:bg-green-100",
            },
            {
              icon: <QrCode className="h-5 w-5 text-purple-500" />,
              label: "Total Scans overall",
              value: counts?.scans || 0,
              color: "bg-purple-50 hover:bg-purple-100",
            },
            {
              icon: <Calendar className="h-5 w-5 text-orange-500" />,
              label: "Today's Scans",
              value: counts?.todayScans || 0,
              color: "bg-orange-50 hover:bg-orange-100",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`${item.color} rounded-lg p-3`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className="text-2xl font-bold">{item.value}</div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Original Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
       
          {
            icon: <Package className="h-5 w-5 text-green-500" />,
            title: "Total Products",
            value: counts?.products || 0,
            description: "Products in database",
            color: "bg-green-50 hover:bg-green-100",
          },
          {
            icon: <CheckCircle className="h-5 w-5 text-purple-500" />,
            title: "Verified Scanners",
            value: counts?.verifiedScanners || 0,
            description: "Scanners with verified status",
            color: "bg-purple-50 hover:bg-purple-100",
          },
          {
            icon: <ShieldCheck className="h-5 w-5 text-orange-500" />,
            title: "Total Admins",
            value: counts?.cms || 0,
            description: "Admins of this system",
            color: "bg-orange-50 hover:bg-orange-100",
          },
        ].map((item, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.03, y: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Card className={`shadow-sm ${item.color}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {item.title}
                </CardTitle>
                {item.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
                <p className="text-muted-foreground text-xs">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
