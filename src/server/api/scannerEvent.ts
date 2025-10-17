import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "./trpc";
import { db } from "../db";
import { safeDecode } from "~/utils/string";
import crypto from "crypto";
import { HardDrive } from "lucide-react";

const generateMarker = (): string => {
  return `$2a$${crypto.randomBytes(8).toString("hex")}$`;
};

// Structure for encoded field
type EncodedData = {
  $: string;
  value: string;
  $$: string;
};

// Encode string with unique start/end markers
const encodeToBase64WithMarkers = (str: string): EncodedData => {
  const marker = generateMarker();
  const base64 = Buffer.from(str, "utf8").toString("base64");
  return {
    $: marker,
    value: base64,
    $$: marker,
  };
};

const decodeFromBase64WithMarkers = (encoded: EncodedData): string => {
  if (encoded.$ !== encoded.$$) {
    throw new Error(
      "Marker validation failed: start and end markers do not match",
    );
  }

  return Buffer.from(encoded.value, "base64").toString("utf8");
};

const hardSafedecode = (field: string | null): string | null => {
  if (!field) return null;

  try {
    const parsed: EncodedData = JSON.parse(field);

    // Additional validation: check if the structure is correct
    if (!parsed.$ || !parsed.value || !parsed.$$) {
      return "Edited Data";
    }

    // This will throw an error if markers don't match
    return decodeFromBase64WithMarkers(parsed);
  } catch (error) {
    if (error instanceof Error) {
      return `Edited Data`;
    }
    return "Edited Data";
  }
};

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
        console.log("RAW EVENT →", event); // full raw object

        console.log("RAW TYPES →", {
          latitude: typeof event.latitude,
          longitude: typeof event.longitude,
          scannerFirstname: typeof event.scanner?.firstname,
          scannerLastname: typeof event.scanner?.lastname,
          product: typeof event.product,
          location: typeof event.location,
        });

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
            firstname: _safeDecode(event.scanner.firstname),
            lastname: _safeDecode(event.scanner.lastname),
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
          location: event.location ? safeDecode(event.location) : null,
          latitude: event.latitude,
          longitude: event.longitude,
        };
      });
    }),
    getScanEventsByManufacturer: publicProcedure
  .input(
    z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }),
  )
  .query(async ({ input }) => {
    const { startDate, endDate } = input;
    const whereClause: any = {
      manufacturerId: { not: null },
      productId: null,
    };
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
        manufacturer: {
          select: {
            id: true,
            name: true,
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
    return scanEvents.map((event) => ({
      ...event,
      scanner: {
        ...event.scanner,
        firstname: _safeDecode(event.scanner.firstname),
        lastname: _safeDecode(event.scanner.lastname),
      },
      manufacturer: event.manufacturer
        ? {
            ...event.manufacturer,
            name: safeDecode(event.manufacturer.name),
            barcode: safeDecode(event.manufacturer.barcode),
          }
        : null,
      latitude: event.latitude,
      longitude: event.longitude,
    }));
  }),
});
