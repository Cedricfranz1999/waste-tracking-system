import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "./trpc";
import { db } from "../db";
import { safeDecode } from "~/utils/string";

export const reportsRouter = createTRPCRouter({
  getReports: publicProcedure
    .input(
      z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { startDate, endDate } = input;

      const whereClause: any = {};

      if (startDate && endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);

        whereClause.scannedAt = {
          gte: new Date(startDate),
          lte: endOfDay,
        };
      } else if (startDate) {
        whereClause.scannedAt = {
          gte: new Date(startDate),
        };
      } else if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);

        whereClause.scannedAt = {
          lte: endOfDay,
        };
      }

      // Get scan events with related data
      const scanEvents = await db.scanEvent.findMany({
        where: whereClause,
        include: {
          product: {
            select: {
              id: true,
              image: true,
              name: true,
              type: true,
              manufacturer: true,
              barcode: true,
            },
          },
          scanner: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              email: true,
            },
          },
        },
        orderBy: {
          scannedAt: "desc",
        },
      });

      // Get scanner statistics
      const scannerStats = await db.scanEvent.groupBy({
        by: ["scannerId"],
        where: whereClause,
        _count: {
          id: true,
        },
      });

      // Get scanner details for the stats
      const scannerDetails = await db.scanner.findMany({
        where: {
          id: {
            in: scannerStats.map((stat) => stat.scannerId),
          },
        },
        select: {
          id: true,
          firstname: true,
          lastname: true,
        },
      });

      // Get product statistics
      const productStats = await db.scanEvent.groupBy({
        by: ["productId"],
        where: {
          ...whereClause,
          productId: {
            not: null,
          },
        },
        _count: {
          id: true,
        },
      });

      // Get product details for the stats
      const productDetails = await db.product.findMany({
        where: {
          id: {
            in: productStats.map((stat) => stat.productId!).filter(Boolean),
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      // Get location statistics
      const locationStats = await db.scanEvent.groupBy({
        by: ["location"],
        where: {
          ...whereClause,
          location: {
            not: null,
          },
        },
        _count: {
          id: true,
        },
      });

      // Get product type statistics
      const typeStats = await db.scanEvent.groupBy({
        by: ["productId"],
        where: {
          ...whereClause,
          productId: {
            not: null,
          },
        },
        _count: {
          id: true,
        },
      });

      // Get product type details
      const productTypeDetails = await db.product.findMany({
        where: {
          id: {
            in: typeStats.map((stat) => stat.productId!).filter(Boolean),
          },
        },
        select: {
          id: true,
          type: true,
        },
      });

      // Format the statistics data
      const formattedScannerStats = scannerStats.map((stat) => {
        const scanner = scannerDetails.find((s) => s.id === stat.scannerId);
        return {
          scannerId: stat.scannerId,
          scannerName: scanner
            ? `${safeDecode(scanner.firstname)} ${safeDecode(scanner.lastname)}`
            : "Unknown",
          count: stat._count.id,
        };
      });

      const formattedProductStats = productStats.map((stat) => {
        const product = productDetails.find((p) => p.id === stat.productId);
        return {
          productId: stat.productId!,
          productName: product ? safeDecode(product.name) : "Unknown",
          count: stat._count.id,
        };
      });

      const formattedLocationStats = locationStats.map((stat) => ({
        location: stat.location ? safeDecode(stat.location) : "Unknown",
        count: stat._count.id,
      }));

      // Aggregate type stats - FIXED
      const typeCountMap: Record<string, number> = {};
      typeStats.forEach((stat) => {
        const product = productTypeDetails.find((p) => p.id === stat.productId);
        if (product && product.type) {
          const type = safeDecode(product.type);
          typeCountMap[type] = (typeCountMap[type] || 0) + stat._count.id;
        }
      });

      const formattedTypeStats = Object.entries(typeCountMap).map(
        ([type, count]) => ({
          type,
          count,
        }),
      );

      // Process scan events with safeDecode
      const processedScanEvents = scanEvents.map((event) => {
        return {
          ...event,
          scanner: {
            ...event.scanner,
            firstname: safeDecode(event.scanner.firstname),
            lastname: safeDecode(event.scanner.lastname),
            email: safeDecode(event.scanner.email),
          },
          product: event.product
            ? {
                ...event.product,
                name: safeDecode(event.product.name),
                type: safeDecode(event.product.type),
                image: safeDecode(event.product.image),
                manufacturer: safeDecode(event.product.manufacturer),
                barcode: safeDecode(event.product.barcode),
              }
            : null,
          location: event.location ? safeDecode(event.location) : null,
          latitude: safeDecode(event.latitude),
          longitude: safeDecode(event.longitude),
        };
      });

      return {
        scanEvents: processedScanEvents,
        scannerStats: formattedScannerStats,
        productStats: formattedProductStats,
        locationStats: formattedLocationStats,
        typeStats: formattedTypeStats,
      };
    }),
});
