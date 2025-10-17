import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import crypto from "crypto";

// Helper: generate a random marker
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

const safeDecode = (field: string | null): string | null => {
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

export const manufacturerRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().optional(),
        barcode: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const encodedData = {
        name: input.name
          ? JSON.stringify(encodeToBase64WithMarkers(input.name))
          : null,
        barcode: JSON.stringify(encodeToBase64WithMarkers(input.barcode)),
      };

      return ctx.db.manufacturer.create({ data: encodedData });
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const manufacturers = await ctx.db.manufacturer.findMany({
      orderBy: { createdAt: "desc" },
    });

    return manufacturers.map((manufacturer) => ({
      ...manufacturer,
      name: safeDecode(manufacturer.name),
      barcode: safeDecode(manufacturer.barcode),
    }));
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const manufacturer = await ctx.db.manufacturer.findUnique({
        where: { id: input.id },
      });

      if (!manufacturer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Manufacturer not found",
        });
      }

      // Validate data integrity before returning
      const decodedManufacturer = {
        ...manufacturer,
        name: safeDecode(manufacturer.name),
        barcode: safeDecode(manufacturer.barcode),
      };

      // Check if any field has validation errors
      const validationErrors = [
        decodedManufacturer.name,
        decodedManufacturer.barcode,
      ].some((value) => value?.includes("Invalid data"));

      if (validationErrors) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Data integrity validation failed",
        });
      }

      return decodedManufacturer;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        barcode: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const encodedData = {
        name: data.name
          ? JSON.stringify(encodeToBase64WithMarkers(data.name))
          : null,
        barcode: JSON.stringify(encodeToBase64WithMarkers(data.barcode)),
      };

      return ctx.db.manufacturer.update({ where: { id }, data: encodedData });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.manufacturer.delete({ where: { id: input.id } });
    }),
});