// In your scannerRouter file
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

export const scannerRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        image: z.string().optional(),
        username: z.string(),
        password: z.string(),
        firstname: z.string(),
        lastname: z.string(),
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
        address: JSON.stringify(encodeToBase64WithMarkers(input.address)),
        gender: JSON.stringify(encodeToBase64WithMarkers(input.gender)),
        birthdate: JSON.stringify(encodeToBase64WithMarkers(input.birthdate)),
      };

      return ctx.db.scanner.create({ data: encodedData });
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const scanners = await ctx.db.scanner.findMany({
      orderBy: { createdAt: "desc" },
    });

    return scanners.map((scanner) => ({
      ...scanner,
      image: safeDecode(scanner.image),
      username: safeDecode(scanner.username),
      password: safeDecode(scanner.password),
      firstname: safeDecode(scanner.firstname),
      lastname: safeDecode(scanner.lastname),
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

      // Validate data integrity before returning
      const decodedScanner = {
        ...scanner,
        image: safeDecode(scanner.image),
        username: safeDecode(scanner.username),
        password: safeDecode(scanner.password),
        firstname: safeDecode(scanner.firstname),
        lastname: safeDecode(scanner.lastname),
        address: safeDecode(scanner.address),
        gender: safeDecode(scanner.gender),
        birthdate: safeDecode(scanner.birthdate),
      };

      // Check if any field has validation errors
      const validationErrors = [
        decodedScanner.image,
        decodedScanner.username,
        decodedScanner.password,
        decodedScanner.firstname,
        decodedScanner.lastname,
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
