import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const productRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        image: z.string().optional(), // This will be base64 string from frontend
        barcode: z.string(),
        manufacturer: z.string(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let imageUrl = input.image;

      // If image is base64, convert it to a URL (you might want to upload to Supabase)
      if (input.image && input.image.startsWith("data:image")) {
        // Extract base64 data and upload to Supabase
        const base64Data = input.image.split(",")[1];
        // Here you would upload to Supabase and get the URL
        // For now, we'll keep it as base64 in DB (you can change this)
        imageUrl = input.image; // Or upload to Supabase and store URL
      }

      const product = await ctx.db.product.create({
        data: {
          ...input,
          image: imageUrl,
        },
      });
      return product;
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const products = await ctx.db.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    return products;
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
      return product;
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        image: z.string().optional(), // base64 string from frontend
        barcode: z.string(),
        manufacturer: z.string(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      let imageUrl = data.image;

      // Handle base64 image conversion
      if (data.image && data.image.startsWith("data:image")) {
        const base64Data = data.image.split(",")[1];
        // Upload to Supabase or handle as needed
        imageUrl = data.image; // Or upload to Supabase and store URL
      }

      const product = await ctx.db.product.update({
        where: { id },
        data: {
          ...data,
          image: imageUrl,
        },
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
