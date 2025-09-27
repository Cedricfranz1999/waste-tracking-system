import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "./trpc";
import { db } from "../db";
import { safeDecode } from "~/utils/string";
import type { EncodedData } from "~/utils/not_hard_coded";

const START_MARKER =
  "$:$2a$12$3KIB5e6BGLf2IZEoWYxtPeTDUN6rgQrHj3gV9qSINNgJdaXXLDaai";
const END_MARKER =
  "$$:$2a$12$ORLOi9cxLH/qPAT4FE2MLuBjIz7Nb7H1hTd1QcynsjIyP5j7Z1KHi";

type _EncodedData = {
  $: string;
  value: string;
  $$: string;
};

const _encodeToBase64WithMarkers = (str: string): EncodedData => {
  const base64 = Buffer.from(str, "utf8").toString("base64");
  return {
    $: START_MARKER,
    value: base64,
    $$: END_MARKER,
  };
};

const _decodeFromBase64WithMarkers = (encoded: EncodedData): string => {
  if (encoded.$ !== START_MARKER || encoded.$$ !== END_MARKER) {
    throw new Error("Marker validation failed: markers do not match");
  }
  return Buffer.from(encoded.value, "base64").toString("utf8");
};

const _safeDecode = (field: string | null): string | null => {
  if (!field) return null;
  try {
    const parsed: EncodedData = JSON.parse(field);
    if (
      !parsed.$ ||
      !parsed.value ||
      !parsed.$$ ||
      parsed.$ !== START_MARKER ||
      parsed.$$ !== END_MARKER
    ) {
      return "Edited Data";
    }
    return _decodeFromBase64WithMarkers(parsed);
  } catch (error) {
    return "Edited Data";
  }
};

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
          typeCountMap[type as any] =
            (typeCountMap[type as any] || 0) + stat._count.id;
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
            firstname: _safeDecode(event.scanner.firstname),
            lastname: _safeDecode(event.scanner.lastname),
            email: _safeDecode(event.scanner.email),
          },
          product: event.product
            ? {
                ...event.product,
                name: safeDecode(event.product.name),
                type: event.product.type,
                image: safeDecode(event.product.image),
                manufacturer: safeDecode(event.product.manufacturer),
                barcode: safeDecode(event.product.barcode),
              }
            : null,
          location: event.location ? event.location : null,
          latitude: event.latitude,
          longitude: event.longitude,
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
