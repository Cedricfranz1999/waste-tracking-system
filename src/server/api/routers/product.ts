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

export const productRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        image: z.string().optional(),
        name: z.string().optional(),
        barcode: z.string(),
        manufacturer: z.string(),
        description: z.string().optional(),
        type: z.enum(["INTERNATIONAL", "LOCAL"]).default("LOCAL"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const encodedData = {
        image: input.image
          ? JSON.stringify(encodeToBase64WithMarkers(input.image))
          : null,
        name: input.name
          ? JSON.stringify(encodeToBase64WithMarkers(input.name))
          : null,
        barcode: JSON.stringify(encodeToBase64WithMarkers(input.barcode)),
        manufacturer: JSON.stringify(
          encodeToBase64WithMarkers(input.manufacturer),
        ),
        description: input.description
          ? JSON.stringify(encodeToBase64WithMarkers(input.description))
          : null,
        type: input.type,
      };

      return ctx.db.product.create({ data: encodedData });
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    // const base64 = Buffer.from("0 14285", "utf8").toString("base64");

    const products = await ctx.db.product.findMany({
      orderBy: { createdAt: "desc" },
      where: {
        // barcode: {
        //   contains: `"value":"${base64}"`,
        // },
      },
    });

    return products.map((product) => ({
      ...product,
      image: safeDecode(product.image),
      name: safeDecode(product.name),
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
        name: safeDecode(product.name),
        barcode: safeDecode(product.barcode),
        manufacturer: safeDecode(product.manufacturer),
        description: safeDecode(product.description),
      };

      // Check if any field has validation errors
      const validationErrors = [
        decodedProduct.image,
        decodedProduct.name,
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
        name: z.string().optional(),
        barcode: z.string(),
        manufacturer: z.string(),
        description: z.string().optional(),
        type: z.enum(["INTERNATIONAL", "LOCAL"]).default("LOCAL"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const encodedData = {
        image: data.image
          ? JSON.stringify(encodeToBase64WithMarkers(data.image))
          : null,
        name: data.name
          ? JSON.stringify(encodeToBase64WithMarkers(data.name))
          : null,
        barcode: JSON.stringify(encodeToBase64WithMarkers(data.barcode)),
        manufacturer: JSON.stringify(
          encodeToBase64WithMarkers(data.manufacturer),
        ),
        description: data.description
          ? JSON.stringify(encodeToBase64WithMarkers(data.description))
          : null,
        type: data.type,
      };

      return ctx.db.product.update({ where: { id }, data: encodedData });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.product.delete({ where: { id: input.id } });
    }),
});
