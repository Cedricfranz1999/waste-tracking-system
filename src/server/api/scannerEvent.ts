import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "./trpc";
import { db } from "../db";
import { safeDecode } from "~/utils/string";

export const scanEventRouter = createTRPCRouter({
  getScanEvents: publicProcedure
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
            },
          },
        },
        orderBy: {
          scannedAt: "desc",
        },
      });

      return scanEvents.map((event) => {
        // Debug logs for latitude & longitude
        console.log("BEFORE → LAT:", event.latitude, "LNG:", event.longitude);

        const decodedLat =
          event.latitude && event.latitude !== null
            ? safeDecode(event.latitude)
            : null;
        const decodedLng =
          event.longitude && event.longitude !== null
            ? safeDecode(event.longitude)
            : null;

        return {
          ...event,
          scanner: {
            ...event.scanner,
            firstname: safeDecode(event.scanner.firstname),
            lastname: safeDecode(event.scanner.lastname),
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
    }),
});
