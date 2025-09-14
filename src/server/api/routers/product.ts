// In your productRouter file
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
    $$: marker, // Use the same marker for both start and end
  };
};

// Validate and decode string from stored JSON
const decodeFromBase64WithMarkers = (encoded: EncodedData): string => {
  // Validate that start and end markers match
  if (encoded.$ !== encoded.$$) {
    throw new Error(
      "Marker validation failed: start and end markers do not match",
    );
  }

  return Buffer.from(encoded.value, "base64").toString("utf8");
};

// Safe decoder for DB fields with validation
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

// Additional validation function if you want to check data before storing
const validateEncodedData = (field: string | null): boolean => {
  if (!field) return true;

  try {
    const parsed: EncodedData = JSON.parse(field);

    if (!parsed.$ || !parsed.value || !parsed.$$) {
      return false;
    }

    // Check if markers match
    return parsed.$ === parsed.$$;
  } catch {
    return false;
  }
};

export const productRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        image: z.string().optional(),
        barcode: z.string(),
        manufacturer: z.string(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const encodedData = {
        image: input.image
          ? JSON.stringify(encodeToBase64WithMarkers(input.image))
          : null,
        barcode: JSON.stringify(encodeToBase64WithMarkers(input.barcode)),
        manufacturer: JSON.stringify(
          encodeToBase64WithMarkers(input.manufacturer),
        ),
        description: input.description
          ? JSON.stringify(encodeToBase64WithMarkers(input.description))
          : null,
      };

      return ctx.db.product.create({ data: encodedData });
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const products = await ctx.db.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    return products.map((product) => ({
      ...product,
      image: safeDecode(product.image),
      barcode: safeDecode(product.barcode),
      manufacturer: safeDecode(product.manufacturer),
      description: safeDecode(product.description),
    }));
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.product.findUnique({
        where: { id: input.id },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // Validate data integrity before returning
      const decodedProduct = {
        ...product,
        image: safeDecode(product.image),
        barcode: safeDecode(product.barcode),
        manufacturer: safeDecode(product.manufacturer),
        description: safeDecode(product.description),
      };

      // Check if any field has validation errors
      const validationErrors = [
        decodedProduct.image,
        decodedProduct.barcode,
        decodedProduct.manufacturer,
        decodedProduct.description,
      ].some((value) => value?.includes("Invalid data"));

      if (validationErrors) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Data integrity validation failed",
        });
      }

      return decodedProduct;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        image: z.string().optional(),
        barcode: z.string(),
        manufacturer: z.string(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const encodedData = {
        image: data.image
          ? JSON.stringify(encodeToBase64WithMarkers(data.image))
          : null,
        barcode: JSON.stringify(encodeToBase64WithMarkers(data.barcode)),
        manufacturer: JSON.stringify(
          encodeToBase64WithMarkers(data.manufacturer),
        ),
        description: data.description
          ? JSON.stringify(encodeToBase64WithMarkers(data.description))
          : null,
      };

      return ctx.db.product.update({ where: { id }, data: encodedData });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.product.delete({ where: { id: input.id } });
    }),
});
