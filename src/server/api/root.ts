import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { authRouter } from "./routers/auth";
import { cmsRouter } from "./routers/cms";
import { productRouter } from "./routers/product";
import { scannerRouter } from "./scanner";
import { dashboardRouter } from "./dashboard";
import { scanEventRouter } from "./scannerEvent";
import { reportsRouter } from "./reports";
import { manufacturerRouter } from "./routers/manufacturer";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  cms: cmsRouter,
  product: productRouter,
  scanner: scannerRouter,
  dashboard: dashboardRouter,
  scanEvent: scanEventRouter,
  reports: reportsRouter,
  manufacturer: manufacturerRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
