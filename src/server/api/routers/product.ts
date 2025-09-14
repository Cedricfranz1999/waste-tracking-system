import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// Helper functions to encode/decode base64
const encodeToBase64 = (str: string): string => {
  return Buffer.from(str).toString("base64");
};

const decodeFromBase64 = (str: string): string => {
  return Buffer.from(str, "base64").toString("utf8");
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
      // Encode all string fields to base64 before storing
      const encodedData = {
        image: input.image ? encodeToBase64(input.image) : null,
        barcode: encodeToBase64(input.barcode),
        manufacturer: encodeToBase64(input.manufacturer),
        description: input.description
          ? encodeToBase64(input.description)
          : null,
      };

      const product = await ctx.db.product.create({
        data: encodedData,
      });
      return product;
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const products = await ctx.db.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Decode all base64 fields for frontend display
    return products.map((product) => ({
      ...product,
      image: product.image ? decodeFromBase64(product.image) : null,
      barcode: decodeFromBase64(product.barcode),
      manufacturer: decodeFromBase64(product.manufacturer),
      description: product.description
        ? decodeFromBase64(product.description)
        : null,
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

      // Decode all base64 fields
      return {
        ...product,
        image: product.image ? decodeFromBase64(product.image) : null,
        barcode: decodeFromBase64(product.barcode),
        manufacturer: decodeFromBase64(product.manufacturer),
        description: product.description
          ? decodeFromBase64(product.description)
          : null,
      };
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

      // Encode all string fields to base64
      const encodedData = {
        image: data.image ? encodeToBase64(data.image) : null,
        barcode: encodeToBase64(data.barcode),
        manufacturer: encodeToBase64(data.manufacturer),
        description: data.description ? encodeToBase64(data.description) : null,
      };

      const product = await ctx.db.product.update({
        where: { id },
        data: encodedData,
      });
      return product;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.product.delete({
        where: { id: input.id },
      });
      return product;
    }),
});
