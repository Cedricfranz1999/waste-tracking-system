import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// Hardcoded markers
const START_MARKER =
  "$:$2a$12$3KIB5e6BGLf2IZEoWYxtPeTDUN6rgQrHj3gV9qSINNgJdaXXLDaai";
const END_MARKER =
  "$$:$2a$12$ORLOi9cxLH/qPAT4FE2MLuBjIz7Nb7H1hTd1QcynsjIyP5j7Z1KHi";

type EncodedData = {
  $: string;
  value: string;
  $$: string;
};

const encodeToBase64WithMarkers = (str: string): EncodedData => {
  const base64 = Buffer.from(str, "utf8").toString("base64");
  return {
    $: START_MARKER,
    value: base64,
    $$: END_MARKER,
  };
};

const decodeFromBase64WithMarkers = (encoded: EncodedData): string => {
  if (encoded.$ !== START_MARKER || encoded.$$ !== END_MARKER) {
    throw new Error("Marker validation failed: markers do not match");
  }
  return Buffer.from(encoded.value, "base64").toString("utf8");
};

const safeDecode = (field: string | null): string | null => {
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
    return decodeFromBase64WithMarkers(parsed);
  } catch (error) {
    return "Edited Data";
  }
};

export const scannerRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        image: z.string().optional(),
        username: z.string(),
        password: z.string(),
        firstname: z.string(),
        lastname: z.string(),
        email: z.string().email(),
        address: z.string(),
        gender: z.string(),
        birthdate: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const encodedData = {
        image: input.image
          ? JSON.stringify(encodeToBase64WithMarkers(input.image))
          : null,
        username: JSON.stringify(encodeToBase64WithMarkers(input.username)),
        password: JSON.stringify(encodeToBase64WithMarkers(input.password)),
        firstname: JSON.stringify(encodeToBase64WithMarkers(input.firstname)),
        lastname: JSON.stringify(encodeToBase64WithMarkers(input.lastname)),
        email: JSON.stringify(encodeToBase64WithMarkers(input.email)),
        address: JSON.stringify(encodeToBase64WithMarkers(input.address)),
        gender: JSON.stringify(encodeToBase64WithMarkers(input.gender)),
        birthdate: JSON.stringify(encodeToBase64WithMarkers(input.birthdate)),
      };
      return ctx.db.scanner.create({ data: encodedData });
    }),
  getAll: publicProcedure.query(async ({ ctx }) => {
    const scanners = await ctx.db.scanner.findMany({
      where: {
        email: JSON.stringify(encodeToBase64WithMarkers("johndoe@gmail.com")),
      },
    });
    return scanners.map((scanner) => ({
      ...scanner,
      image: safeDecode(scanner.image),
      username: safeDecode(scanner.username),
      password: safeDecode(scanner.password),
      firstname: safeDecode(scanner.firstname),
      lastname: safeDecode(scanner.lastname),
      email: safeDecode(scanner.email),
      address: safeDecode(scanner.address),
      gender: safeDecode(scanner.gender),
      birthdate: safeDecode(scanner.birthdate),
    }));
  }),
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const scanner = await ctx.db.scanner.findUnique({
        where: { id: input.id },
      });
      if (!scanner) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Scanner not found",
        });
      }
      const decodedScanner = {
        ...scanner,
        image: safeDecode(scanner.image),
        username: safeDecode(scanner.username),
        password: safeDecode(scanner.password),
        firstname: safeDecode(scanner.firstname),
        lastname: safeDecode(scanner.lastname),
        email: safeDecode(scanner.email),
        address: safeDecode(scanner.address),
        gender: safeDecode(scanner.gender),
        birthdate: safeDecode(scanner.birthdate),
      };
      const validationErrors = [
        decodedScanner.image,
        decodedScanner.username,
        decodedScanner.password,
        decodedScanner.firstname,
        decodedScanner.lastname,
        decodedScanner.email,
        decodedScanner.address,
        decodedScanner.gender,
        decodedScanner.birthdate,
      ].some((value) => value?.includes("Edited Data"));
      if (validationErrors) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Data integrity validation failed",
        });
      }
      return decodedScanner;
    }),
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        image: z.string().optional(),
        username: z.string(),
        password: z.string(),
        firstname: z.string(),
        lastname: z.string(),
        email: z.string().email(),
        address: z.string(),
        gender: z.string(),
        birthdate: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const encodedData = {
        image: data.image
          ? JSON.stringify(encodeToBase64WithMarkers(data.image))
          : null,
        username: JSON.stringify(encodeToBase64WithMarkers(data.username)),
        password: JSON.stringify(encodeToBase64WithMarkers(data.password)),
        firstname: JSON.stringify(encodeToBase64WithMarkers(data.firstname)),
        lastname: JSON.stringify(encodeToBase64WithMarkers(data.lastname)),
        email: JSON.stringify(encodeToBase64WithMarkers(data.email)),
        address: JSON.stringify(encodeToBase64WithMarkers(data.address)),
        gender: JSON.stringify(encodeToBase64WithMarkers(data.gender)),
        birthdate: JSON.stringify(encodeToBase64WithMarkers(data.birthdate)),
      };
      return ctx.db.scanner.update({ where: { id }, data: encodedData });
    }),
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.scanner.delete({ where: { id: input.id } });
    }),
});
