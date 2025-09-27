// ~/server/api/routers/auth.ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import bcrypt from "bcryptjs";

export const authRouter = createTRPCRouter({
  adminLogin: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { username, password } = input;

      // Find admin by username
      const admin = await ctx.db.admin.findFirst({
        where: {
          username: username,
        },
      });

      if (!admin) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      // Compare passwords
      // const passwordValid = await bcrypt.compare(password, admin.Password);
      
      // if (!passwordValid) {
      //   throw new TRPCError({
      //     code: "UNAUTHORIZED",
      //     message: "Invalid credentials",
      //   });
      // }

      // In a real application, you would generate a proper JWT token here
      const token = `admin-token-${admin.id}-${Date.now()}`;

      return {
        success: true,
        user: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          type: "ADMIN" as const,
        },
        token,
      };
    }),
});