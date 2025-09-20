// server/routers/dashboard.ts
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { createTRPCRouter, publicProcedure } from "./trpc";

const prisma = new PrismaClient();

export const dashboardRouter = createTRPCRouter({
  getCounts: publicProcedure.query(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      scanners,
      products,
      scans,
      verifiedScanners,
      todayScans,
      cms,
      internationalProducts,
      localProducts,
    ] = await Promise.all([
      prisma.scanner.count(),
      prisma.product.count(),
      prisma.scanEvent.count(),
      prisma.scanner.count({ where: { verifyAt: { not: null } } }),
      prisma.scanEvent.count({ where: { scannedAt: { gte: today } } }),
      prisma.cms.count(),
      prisma.product.count({ where: { type: "INTERNATIONAL" } }),
      prisma.product.count({ where: { type: "LOCAL" } }),
    ]);

    return {
      scanners,
      products,
      scans,
      verifiedScanners,
      todayScans,
      cms,
      internationalProducts,
      localProducts,
    };
  }),
});
